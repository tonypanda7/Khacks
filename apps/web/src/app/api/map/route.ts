import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const priorityBand = searchParams.get('priorityBand')

    const where: any = {}
    if (category) where.category = category
    if (status) where.status = status
    if (priorityBand) where.priorityBand = priorityBand

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

    return NextResponse.json(issues)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
