import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIssueById } from '@/lib/store'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 1. Try Prisma (TCP connection)
  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        reports: {
          include: { image: true, user: true },
          orderBy: { createdAt: 'desc' },
        },
        events: { orderBy: { createdAt: 'asc' } },
        fixAttempts: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (issue) {
      const firstImgPath = issue.reports?.[0]?.image?.path
      const imageUrl = firstImgPath
        ? (firstImgPath.startsWith('http') ? firstImgPath : `/api/images${firstImgPath}`)
        : undefined

      return NextResponse.json({
        ...issue,
        imageUrl,
      })
    }
  } catch (err: any) {
    // Database offline fallback
  }

  // 2. Try Supabase REST over HTTPS port 443 (firewall-proof)
  try {
    const { data: supaIssue } = await supabaseAdmin
      .from('issues')
      .select('*')
      .eq('id', id)
      .single()

    if (supaIssue) {
      const { data: supaReports } = await supabaseAdmin
        .from('reports')
        .select('*')
        .eq('issue_id', id)
        .order('created_at', { ascending: false })

      const imageIds = (supaReports || []).map((r: any) => r.image_id).filter(Boolean)
      const { data: supaImages } = await supabaseAdmin
        .from('images')
        .select('*')
        .in('id', imageIds)

      const imgMap = new Map((supaImages || []).map((img: any) => [img.id, img]))

      const reportsWithImages = (supaReports || []).map((r: any) => ({
        ...r,
        createdAt: r.created_at,
        image: imgMap.get(r.image_id) || null,
      }))

      const firstImgPath = reportsWithImages[0]?.image?.path
      const imageUrl = firstImgPath
        ? (firstImgPath.startsWith('http') ? firstImgPath : `/api/images${firstImgPath}`)
        : undefined

      return NextResponse.json({
        ...supaIssue,
        priorityScore: supaIssue.priority_score,
        priorityBand: supaIssue.priority_band,
        priorityRationale: supaIssue.priority_rationale,
        severityRationale: supaIssue.severity_rationale,
        reportCount: supaIssue.report_count,
        imageUrl,
        reports: reportsWithImages,
        events: [],
        fixAttempts: [],
      })
    }
  } catch (supaErr) {
    // Supabase REST error
  }

  // 3. Fallback to local memory / file store
  const issue = getIssueById(id)
  if (issue) {
    return NextResponse.json(issue)
  }

  return NextResponse.json({ error: `Issue ${id} not found` }, { status: 404 })
}
