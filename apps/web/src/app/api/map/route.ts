import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllIssues } from '@/lib/store'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const priorityBand = searchParams.get('priorityBand')
  const overdue = searchParams.get('overdue')

  let issues: any[] = []

  // 1. Try Prisma (TCP connection)
  try {
    const where: any = {}
    if (category) where.category = category
    if (status) where.status = status
    if (priorityBand) where.priorityBand = priorityBand
    if (overdue === 'true') {
      where.flags = { has: 'OVERDUE' }
    }

    issues = await prisma.issue.findMany({
      where,
      select: {
        id: true,
        category: true,
        lat: true,
        lon: true,
        status: true,
        priorityBand: true,
        priorityScore: true,
        reportCount: true,
        flags: true,
        severity: true,
        isSeed: true,
        severityRationale: true,
        priorityRationale: true,
      },
    })
  } catch (err: any) {
    // Prisma offline
  }

  // 2. Try Supabase REST over HTTPS port 443 (firewall-proof)
  if (!issues || issues.length === 0) {
    try {
      let query = supabaseAdmin.from('issues').select('*')
      if (category) query = query.eq('category', category)
      if (status) query = query.eq('status', status)
      if (priorityBand) query = query.eq('priority_band', priorityBand)

      const { data, error } = await query
      if (data && data.length > 0) {
        issues = data.map((d: any) => ({
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
        }))
      }
    } catch {
      // Supabase REST error
    }
  }

  // 3. Fallback to local store
  if (!issues || issues.length === 0) {
    issues = getAllIssues()
  }

  let results = [...issues]
  if (category) results = results.filter(i => i.category === category)
  if (status) results = results.filter(i => i.status === status)
  if (priorityBand) results = results.filter(i => i.priorityBand === priorityBand)

  return NextResponse.json(results)
}
