import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      include: {
        reports: {
          include: { image: true },
          orderBy: { createdAt: 'desc' },
        },
        events: { orderBy: { createdAt: 'desc' }, take: 10 },
        fixAttempts: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { priorityScore: 'desc' },
    })

    return NextResponse.json(issues)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
