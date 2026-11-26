import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FALLBACK_SEED_ISSUES } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const priorityBand = searchParams.get('priorityBand')
    const overdue = searchParams.get('overdue')

    const where: any = {}
    if (category) where.category = category
    if (status) where.status = status
    if (priorityBand) where.priorityBand = priorityBand
    if (overdue === 'true') {
      where.flags = { has: 'OVERDUE' }
    }

    const issues = await prisma.issue.findMany({
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
      },
    })

    if (issues && issues.length > 0) {
      return NextResponse.json(issues)
    }
  } catch (err: any) {
    // Database not yet configured or offline — fall through to fallback demo issues
  }

  // Filter fallback data
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const priorityBand = searchParams.get('priorityBand')

  let results = [...FALLBACK_SEED_ISSUES]
  if (category) results = results.filter(i => i.category === category)
  if (status) results = results.filter(i => i.status === status)
  if (priorityBand) results = results.filter(i => i.priorityBand === priorityBand)

  return NextResponse.json(results)
}
