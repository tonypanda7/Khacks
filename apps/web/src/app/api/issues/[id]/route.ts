import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }
    return NextResponse.json(issue)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
