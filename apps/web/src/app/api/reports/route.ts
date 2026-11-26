import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { parseExif } from '@/lib/exif'
import { sha256 } from '@/lib/hash'
import { saveImage, getImagePath } from '@/lib/storage'
import { callAI, checkAIService } from '@/lib/ai-client'
import { getThresholds, getSlaConfig } from '@/lib/config'
import { haversineDistance } from '@/lib/haversine'
import fs from 'fs'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    if (!session.isLoggedIn || session.role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized. Please login as citizen user.' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate file type and size
    if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/jpg')) {
      return NextResponse.json({ error: 'Only JPEG images are accepted' }, { status: 400 })
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 20MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Parse EXIF
    const exif = await parseExif(buffer)
    if (!exif || exif.lat === undefined || exif.lon === undefined) {
      return NextResponse.json({ 
        error: 'This photo has no location or time. Upload the original photo from your camera.' 
      }, { status: 400 })
    }

    // Store original bytes
    const hash = sha256(buffer)
    const imagePath = await saveImage(buffer, hash, 'report')

    // Create image record
    const image = await prisma.image.create({
      data: {
        kind: 'report',
        path: imagePath,
        sha256: hash,
        exif: exif.raw as any,
      }
    })

    // Check AI service
    const aiStatus = await checkAIService()
    
    let classification: any = null
    let matchedIssueId: string | null = null
    let askConfirmation = false
    let candidateIssue: any = null

    if (aiStatus.available) {
      // Classify
      try {
        const classifyForm = new FormData()
        const blob = new Blob([buffer], { type: 'image/jpeg' })
        classifyForm.append('image', blob, 'image.jpg')
        classification = await callAI('/classify', classifyForm)
      } catch (error) {
        console.error('Classification failed:', error)
        classification = { 
          is_civic_issue: true, 
          category: 'pothole', 
          severity_1_5: 3, 
          confidence: 0.5, 
          severity_rationale: 'Classification fallback due to AI model timeout/error', 
          visible_cues: ['road surface defect'] 
        }
      }

      // Duplicate detection
      if (classification?.is_civic_issue && classification?.category) {
        const thresholds = getThresholds()
        const radius = thresholds.dedup?.candidate_radius_m || 40

        // Find candidate issues of the same category
        const candidates = await prisma.issue.findMany({
          where: {
            category: classification.category,
            status: { notIn: ['FIX_VERIFIED'] },
          },
          include: { reports: { include: { image: true } } },
        })

        // Filter by distance
        const nearbyCandidates = candidates.filter(issue => {
          const dist = haversineDistance(exif.lat, exif.lon, issue.lat, issue.lon)
          return dist <= radius
        })

        if (nearbyCandidates.length > 0) {
          try {
            const bestCandidate = nearbyCandidates[0]
            const refImage = bestCandidate.reports[0]?.image
            if (refImage) {
              const fullRefPath = getImagePath(refImage.path)
              if (fs.existsSync(fullRefPath)) {
                const refBuffer = fs.readFileSync(fullRefPath)
                const sameDefectForm = new FormData()
                sameDefectForm.append('image_new', new Blob([buffer], { type: 'image/jpeg' }), 'new.jpg')
                sameDefectForm.append('image_ref', new Blob([refBuffer], { type: 'image/jpeg' }), 'ref.jpg')
                sameDefectForm.append('category', classification.category)

                const result = await callAI('/same-defect', sameDefectForm)
                
                const attachMin = thresholds.dedup?.attach_min || 0.8
                const askMin = thresholds.dedup?.ask_min || 0.5

                if (result.same_defect_prob >= attachMin) {
                  matchedIssueId = bestCandidate.id
                } else if (result.same_defect_prob >= askMin) {
                  askConfirmation = true
                  candidateIssue = {
                    id: bestCandidate.id,
                    category: bestCandidate.category,
                    reportCount: bestCandidate.reportCount,
                    refImagePath: refImage.path,
                    probability: result.same_defect_prob,
                    rationale: result.rationale
                  }
                }
              }
            }
          } catch (error) {
            console.error('Duplicate detection failed:', error)
          }
        }
      }
    } else {
      // AI unavailable — create as NEEDS_REVIEW
      classification = { 
        is_civic_issue: true, 
        category: 'pothole', 
        severity_1_5: 3, 
        confidence: 0, 
        severity_rationale: 'AI service unavailable — flagged for human review', 
        visible_cues: [] 
      }
    }

    // If confirmation is needed (between ask_min and attach_min)
    if (askConfirmation && candidateIssue) {
      const report = await prisma.report.create({
        data: {
          issueId: candidateIssue.id,
          userId: session.userId!,
          imageId: image.id,
          lat: exif.lat,
          lon: exif.lon,
          capturedAt: exif.capturedAt,
          classification: classification as any,
          humanOverride: false,
        }
      })

      return NextResponse.json({
        status: 'confirm_duplicate',
        reportId: report.id,
        classification,
        candidateIssue,
        message: 'Same pothole? Confirm to attach this report to the existing issue.',
      })
    }

    // Create or attach
    let issueId: string
    const slaConfig = getSlaConfig()
    const category = classification?.category || 'pothole'

    if (matchedIssueId) {
      issueId = matchedIssueId
      await prisma.issue.update({
        where: { id: issueId },
        data: { reportCount: { increment: 1 } },
      })
      await prisma.event.create({
        data: {
          issueId,
          type: 'REPORT_ATTACHED',
          payload: { imageId: image.id, lat: exif.lat, lon: exif.lon } as any,
        }
      })
    } else {
      const slaHours = slaConfig[category]?.sla_hours || 72
      const slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000)
      const minConfidence = getThresholds().classify?.min_confidence || 0.6
      const initialStatus = (classification?.confidence ?? 0) < minConfidence ? 'NEEDS_REVIEW' : 'REPORTED'
      
      const issue = await prisma.issue.create({
        data: {
          category,
          lat: exif.lat,
          lon: exif.lon,
          status: initialStatus,
          severity: classification?.severity_1_5 ?? 3,
          severityRationale: classification?.severity_rationale ?? 'Evaluated on intake',
          slaDueAt,
          reportCount: 1,
        }
      })
      issueId = issue.id
      
      await prisma.event.create({
        data: {
          issueId,
          type: 'ISSUE_CREATED',
          payload: { classification } as any,
        }
      })

      // Route the issue asynchronously
      if (aiStatus.available) {
        callAI('/route', { category, lat: exif.lat, lon: exif.lon })
          .then(async (routeResult) => {
            await prisma.issue.update({
              where: { id: issueId },
              data: { 
                status: 'ROUTED',
                routedAuthorities: routeResult as any 
              },
            })
            await prisma.event.create({
              data: { issueId, type: 'ROUTED', payload: routeResult as any }
            })
          })
          .catch(err => console.error('Routing failed:', err))
      }
    }

    // Create report record
    const report = await prisma.report.create({
      data: {
        issueId,
        userId: session.userId!,
        imageId: image.id,
        lat: exif.lat,
        lon: exif.lon,
        capturedAt: exif.capturedAt,
        classification: classification as any,
        humanOverride: false,
      }
    })

    // Trigger priority scoring asynchronously
    if (aiStatus.available) {
      callAI('/priority', { 
        issue_id: issueId,
        category,
        severity: classification?.severity_1_5 || 3,
        report_count: matchedIssueId ? 2 : 1,
        hours_open: 0,
        sla_hours: 72,
        nearby_places: ['Guindy Bus Stand', 'Anna University Main Gate'],
        rain_alert: false,
      })
        .then(async (priorityResult) => {
          await prisma.issue.update({
            where: { id: issueId },
            data: {
              priorityScore: priorityResult.priority_0_100,
              priorityBand: priorityResult.band,
              priorityRationale: priorityResult.rationale,
            }
          })
        })
        .catch(err => console.error('Priority scoring failed:', err))
    }

    return NextResponse.json({
      status: matchedIssueId ? 'attached' : 'created',
      reportId: report.id,
      issueId,
      classification,
    })
  } catch (err: any) {
    console.error('Report submission error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
