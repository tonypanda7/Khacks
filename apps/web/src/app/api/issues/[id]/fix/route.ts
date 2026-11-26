import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { parseExif } from '@/lib/exif'
import { sha256 } from '@/lib/hash'
import { saveImage, getImagePath } from '@/lib/storage'
import { callAI, checkAIService } from '@/lib/ai-client'
import fs from 'fs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    if (!session.isLoggedIn || session.role !== 'authority') {
      return NextResponse.json({ error: 'Unauthorized. Authority account required.' }, { status: 401 })
    }

    const { id } = await params
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { reports: { include: { image: true } } }
    })

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const files = formData.getAll('images') as File[]
    
    if (files.length === 0 || files.length > 5) {
      return NextResponse.json({ error: 'Please submit between 1 and 5 fix photos.' }, { status: 400 })
    }

    const imageIds: string[] = []
    const fixImagesB64: string[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/jpg')) {
        return NextResponse.json({ error: 'Only JPEG images accepted' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const exif = await parseExif(buffer)
      if (!exif || exif.lat === undefined || exif.lon === undefined) {
        return NextResponse.json({ 
          error: 'Fix photos must have EXIF location and timestamp data. Upload original camera photos.' 
        }, { status: 400 })
      }

      const hash = sha256(buffer)
      const imagePath = await saveImage(buffer, hash, 'fix')
      
      const image = await prisma.image.create({
        data: {
          kind: 'fix',
          path: imagePath,
          sha256: hash,
          exif: exif.raw as any,
        }
      })
      imageIds.push(image.id)
      fixImagesB64.push(buffer.toString('base64'))
    }

    // Set issue to FIX_SUBMITTED
    await prisma.issue.update({
      where: { id },
      data: { status: 'FIX_SUBMITTED' },
    })

    // Create fix attempt record
    const fixAttempt = await prisma.fixAttempt.create({
      data: {
        issueId: id,
        imageIds,
        decision: null,
      }
    })

    await prisma.event.create({
      data: { issueId: id, type: 'FIX_SUBMITTED', payload: { fixAttemptId: fixAttempt.id, imageIds } as any }
    })

    // Gather reference images from the bundle
    const refImagesB64: string[] = []
    for (const r of issue.reports) {
      if (r.image?.path) {
        const fullPath = getImagePath(r.image.path)
        if (fs.existsSync(fullPath)) {
          refImagesB64.push(fs.readFileSync(fullPath).toString('base64'))
        }
      }
    }

    // Run proof-of-fix verification
    const aiStatus = await checkAIService()
    if (aiStatus.available && refImagesB64.length > 0) {
      try {
        const verifyResult = await callAI('/verify-fix', {
          issue_id: id,
          fix_attempt_id: fixAttempt.id,
          fix_image_ids: imageIds,
          fix_images_b64: fixImagesB64,
          ref_images_b64: refImagesB64,
          category: issue.category,
          severity: issue.severity || 3,
        })

        const newStatus = verifyResult.decision === 'APPROVED' ? 'FIX_VERIFIED' 
          : verifyResult.decision === 'REJECTED' ? 'FIX_REJECTED' 
          : 'NEEDS_REVIEW'

        await prisma.fixAttempt.update({
          where: { id: fixAttempt.id },
          data: {
            pairOutputs: verifyResult.pair_outputs as any,
            fixScore: verifyResult.fix_score,
            decision: verifyResult.decision,
            thresholds: verifyResult.thresholds as any,
            receipt: verifyResult.receipt as any,
          }
        })

        await prisma.issue.update({
          where: { id },
          data: { status: newStatus },
        })

        await prisma.event.create({
          data: { 
            issueId: id, 
            type: `FIX_${verifyResult.decision}`, 
            payload: { fixAttemptId: fixAttempt.id, fixScore: verifyResult.fix_score, receipt: verifyResult.receipt } as any 
          }
        })

        return NextResponse.json({
          status: newStatus,
          fixScore: verifyResult.fix_score,
          decision: verifyResult.decision,
          receipt: verifyResult.receipt,
        })
      } catch (error: any) {
        console.error('Proof-of-fix error:', error)
        await prisma.issue.update({
          where: { id },
          data: { status: 'NEEDS_REVIEW' },
        })
        return NextResponse.json({ status: 'NEEDS_REVIEW', error: error.message || 'Verification failed' })
      }
    }

    return NextResponse.json({ 
      status: 'FIX_SUBMITTED', 
      message: 'AI service offline — queued for verification' 
    })
  } catch (err: any) {
    console.error('Fix submission error:', err)
    return NextResponse.json({ error: err.message || 'Fix submission failed' }, { status: 500 })
  }
}
