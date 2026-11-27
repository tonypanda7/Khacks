import { NextRequest, NextResponse } from 'next/server'
import { getAllIssues } from '@/lib/store'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const priorityBand = searchParams.get('priorityBand')
  const overdue = searchParams.get('overdue')

  let issues: any[] = []

  // 1. Fast in-memory cache check (0.1ms)
  try {
    const local = getAllIssues()
    if (local && local.length > 0) {
      issues = [...local]
    }
  } catch {}

  // 2. High-speed Supabase REST over HTTPS port 443 (firewall-proof, ~200ms)
  try {
    let issueQuery = supabaseAdmin.from('issues').select('*').order('created_at', { ascending: false })
    if (category) issueQuery = issueQuery.eq('category', category)
    if (status) issueQuery = issueQuery.eq('status', status)
    if (priorityBand) issueQuery = issueQuery.eq('priority_band', priorityBand)

    const [issuesRes, reportsRes, imagesRes] = await Promise.all([
      issueQuery,
      supabaseAdmin.from('reports').select('issue_id, image_id'),
      supabaseAdmin.from('images').select('id, path'),
    ])

    if (issuesRes.data && issuesRes.data.length > 0) {
      const imgPathMap = new Map((imagesRes.data || []).map((img: any) => [img.id, img.path]))
      const issueImgMap = new Map()
      for (const rep of reportsRes.data || []) {
        if (rep.issue_id && rep.image_id && !issueImgMap.has(rep.issue_id)) {
          const p = imgPathMap.get(rep.image_id)
          if (p) {
            issueImgMap.set(rep.issue_id, p.startsWith('http') ? p : `/api/images${p}`)
          }
        }
      }

      const supaMapped = issuesRes.data.map((d: any) => ({
        id: d.id,
        category: d.category,
        lat: d.lat,
        lon: d.lon,
        status: d.status,
        priorityBand: d.priority_band || 'HIGH',
        priorityScore: d.priority_score || 70,
        reportCount: d.report_count || 1,
        flags: d.flags || [],
        severity: d.severity,
        isSeed: d.is_seed,
        severityRationale: d.severity_rationale,
        priorityRationale: d.priority_rationale,
        imageUrl: issueImgMap.get(d.id) || undefined,
      }))

      // Merge: prefer Supabase items, deduplicate by id
      const seen = new Set(supaMapped.map((i: any) => i.id))
      issues = [...supaMapped, ...issues.filter((i: any) => !seen.has(i.id))]
    }
  } catch (supaErr) {
    console.warn('Supabase REST query warning:', supaErr)
  }

  let results = [...issues]
  if (category) results = results.filter(i => i.category === category)
  if (status) results = results.filter(i => i.status === status)
  if (priorityBand) results = results.filter(i => i.priorityBand === priorityBand)

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, s-maxage=2, stale-while-revalidate=10',
    }
  })
}
