import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllIssues } from '@/lib/store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const priorityBand = searchParams.get('priorityBand')
  const overdue = searchParams.get('overdue')

  let issues: any[] = []

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
    // Database offline
  }

  if (!issues || issues.length === 0) {
    issues = getAllIssues()
  }

  let results = [...issues]
  if (category) results = results.filter(i => i.category === category)
  if (status) results = results.filter(i => i.status === status)
  if (priorityBand) results = results.filter(i => i.priorityBand === priorityBand)

  return NextResponse.json(results)
}
