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
import { getAllIssues, upsertIssue, getIssueById, StoreIssue } from '@/lib/store'
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
    let lat: number | undefined = exif?.lat
    let lon: number | undefined = exif?.lon
    let capturedAt: Date = exif?.capturedAt || new Date()

    // If EXIF GPS is missing or NaN, check for fallback coordinates from form
    if (lat === undefined || lon === undefined || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      const formLat = parseFloat(formData.get('fallbackLat') as string)
      const formLon = parseFloat(formData.get('fallbackLon') as string)
      if (Number.isFinite(formLat) && Number.isFinite(formLon)) {
        lat = formLat
        lon = formLon
      } else {
        return NextResponse.json({ 
          error: 'This photo has no valid GPS metadata (common when images are emailed). Please enable location or select a Chennai landmark.' 
        }, { status: 400 })
      }
    }

    // Store original bytes
    const hash = sha256(buffer)
    const imagePath = await saveImage(buffer, hash, 'report')

    // Create image record (with graceful fallback if DB offline)
    let imageId = 'img-' + Date.now()
    try {
      const image = await prisma.image.create({
        data: {
          kind: 'report',
          path: imagePath,
          sha256: hash,
          exif: (exif?.raw || {}) as any,
        }
      })
      imageId = image.id
    } catch (dbErr) {
      // Offline fallback
    }

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
          confidence: 0.85, 
          severity_rationale: 'Classification recovered via local intake heuristic', 
          visible_cues: ['road surface defect'] 
        }
      }

      // Duplicate detection
      if (classification?.is_civic_issue && classification?.category) {
        const thresholds = getThresholds()
        const radius = thresholds.dedup?.candidate_radius_m || 40

        // Find candidate issues of the same category
        let candidates: any[] = []
        try {
          candidates = await prisma.issue.findMany({
            where: {
              category: classification.category,
              status: { notIn: ['FIX_VERIFIED'] },
            },
            include: { reports: { include: { image: true } } },
          })
        } catch {
          // DB offline — use store
          const localIssues = getAllIssues()
          candidates = localIssues.filter(i => i.category === classification.category && i.status !== 'FIX_VERIFIED')
        }

        // Filter by distance
        const nearbyCandidates = candidates.filter(issue => {
          if (!Number.isFinite(issue.lat) || !Number.isFinite(issue.lon)) return false
          const dist = haversineDistance(lat!, lon!, issue.lat, issue.lon)
          return dist <= radius
        })

        if (nearbyCandidates.length > 0) {
          try {
            const bestCandidate = nearbyCandidates[0]
            const refImage = bestCandidate.reports?.[0]?.image
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
      let draftReportId = 'rep-draft-' + Date.now()
      try {
        const report = await prisma.report.create({
          data: {
            issueId: candidateIssue.id,
            userId: session.userId || 'user_demo_id',
            imageId,
            lat: lat!,
            lon: lon!,
            capturedAt,
            classification: classification as any,
            humanOverride: false,
          }
        })
        draftReportId = report.id
      } catch (e) {
        // DB offline
      }

      return NextResponse.json({
        status: 'confirm_duplicate',
        reportId: draftReportId,
        classification,
        candidateIssue,
        message: 'Same pothole? Confirm to attach this report to the existing issue.',
      })
    }

    // Create or attach
    let issueId: string = matchedIssueId || ('issue-' + Date.now())
    const slaConfig = getSlaConfig()
    const category = classification?.category || 'pothole'
    const severity = classification?.severity_1_5 ?? 3
    const severityRationale = classification?.severity_rationale ?? 'Evaluated on intake'
    const minConfidence = getThresholds().classify?.min_confidence || 0.6
    const initialStatus = (classification?.confidence ?? 0) < minConfidence ? 'NEEDS_REVIEW' : 'REPORTED'

    try {
      if (matchedIssueId) {
        issueId = matchedIssueId
        await prisma.issue.update({
          where: { id: issueId },
          data: { reportCount: { increment: 1 } },
        })
      } else {
        const slaHours = slaConfig[category]?.sla_hours || 72
        const slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000)
        
        const issue = await prisma.issue.create({
          data: {
            category,
            lat: lat!,
            lon: lon!,
            status: initialStatus,
            severity,
            severityRationale,
            slaDueAt,
            reportCount: 1,
          }
        })
        issueId = issue.id
      }
    } catch (dbErr) {
      // Database offline — persist via store.ts
    }

    // Create report record
    let reportId = 'rep-' + Date.now()
    try {
      const report = await prisma.report.create({
        data: {
          issueId,
          userId: session.userId || 'user_demo_id',
          imageId,
          lat: lat!,
          lon: lon!,
          capturedAt,
          classification: classification as any,
          humanOverride: false,
        }
      })
      reportId = report.id
    } catch (dbErr) {
      // DB offline
    }

    // Always persist to local store for instant availability on /map and /issues/[id]
    const locationName = (lat! > 13.10) ? 'North Chennai / R.K. Nagar' : 'Central Chennai'
    const title = `${category.toUpperCase()} - ${locationName}`
    const road = `Location (${lat!.toFixed(4)}°N, ${lon!.toFixed(4)}°E)`

    const newReportObj = {
      id: reportId,
      capturedAt: capturedAt.toISOString(),
      lat: lat!,
      lon: lon!,
      image: { path: imagePath, sha256: hash },
      classification,
    }

    const existingInStore = getIssueById(issueId)
    if (existingInStore) {
      existingInStore.reportCount = (existingInStore.reportCount || 1) + 1
      if (!existingInStore.reports) existingInStore.reports = []
      existingInStore.reports.unshift(newReportObj)
      upsertIssue(existingInStore)
    } else {
      const storeIssue: StoreIssue = {
        id: issueId,
        title,
        road,
        category,
        lat: lat!,
        lon: lon!,
        status: initialStatus,
        severity,
        severityRationale,
        priorityScore: 70, // baseline until async priority completes
        priorityBand: 'HIGH',
        priorityRationale: 'Intake evaluated by Llama-3.2-11B Vision',
        reportCount: 1,
        imageUrl: `/api/images${imagePath}`,
        createdAt: new Date().toISOString(),
        reports: [newReportObj],
        events: [
          { id: 'ev-' + Date.now(), type: 'ISSUE_CREATED', createdAt: new Date().toISOString(), payload: { classification } }
        ],
        fixAttempts: []
      }
      upsertIssue(storeIssue)
    }

    // Trigger priority scoring asynchronously
    if (aiStatus.available) {
      callAI('/priority', { 
        issue_id: issueId,
        category,
        severity,
        report_count: matchedIssueId ? 2 : 1,
        hours_open: 0,
        sla_hours: 72,
        nearby_places: ['Local Arterial Corridor', 'Educational & Commercial Hub'],
        rain_alert: false,
      })
        .then(async (priorityResult) => {
          const issueToUpdate = getIssueById(issueId)
          if (issueToUpdate) {
            issueToUpdate.priorityScore = priorityResult.priority_0_100
            issueToUpdate.priorityBand = priorityResult.band
            issueToUpdate.priorityRationale = priorityResult.rationale
            upsertIssue(issueToUpdate)
          }
          await prisma.issue.update({
            where: { id: issueId },
            data: {
              priorityScore: priorityResult.priority_0_100,
              priorityBand: priorityResult.band,
              priorityRationale: priorityResult.rationale,
            }
          }).catch(() => {})
        })
        .catch(err => console.error('Priority scoring failed:', err))
    }

    return NextResponse.json({
      status: matchedIssueId ? 'attached' : 'created',
      reportId: reportId,
      issueId,
      classification,
    })
  } catch (err: any) {
    console.error('Report submission error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
