import { NextRequest, NextResponse } from 'next/server'
import { getIssueById } from '@/lib/store'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 1. Fast in-memory check (0.1ms)
  try {
    const localIssue = getIssueById(id)
    if (localIssue && localIssue.reports && localIssue.reports.length > 0) {
      return NextResponse.json(localIssue, {
        headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30' }
      })
    }
  } catch {}

  // 2. High-speed Supabase REST over HTTPS port 443 (~150ms)
  try {
    const [issueRes, reportsRes] = await Promise.all([
      supabaseAdmin.from('issues').select('*').eq('id', id).single(),
      supabaseAdmin.from('reports').select('*').eq('issue_id', id).order('created_at', { ascending: false })
    ])

    const supaIssue = issueRes.data
    if (supaIssue) {
      const supaReports = reportsRes.data || []
      const imageIds = supaReports.map((r: any) => r.image_id).filter(Boolean)

      let supaImages: any[] = []
      if (imageIds.length > 0) {
        const { data: imgData } = await supabaseAdmin.from('images').select('*').in('id', imageIds)
        supaImages = imgData || []
      }

      const imgMap = new Map(supaImages.map((img: any) => [img.id, img]))

      const reportsWithImages = supaReports.map((r: any) => ({
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
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30' }
      })
    }
  } catch (supaErr) {
    console.warn('Supabase REST issue fetch warning:', supaErr)
  }

  // 3. Fallback to basic local issue if exists
  const localIssue = getIssueById(id)
  if (localIssue) {
    return NextResponse.json(localIssue)
  }

  return NextResponse.json({ error: `Issue ${id} not found` }, { status: 404 })
}
