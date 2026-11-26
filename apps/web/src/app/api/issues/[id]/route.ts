import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FALLBACK_SEED_ISSUES } from '@/lib/mock-data'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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
      return NextResponse.json(issue)
    }
  } catch (err: any) {
    // Database offline fallback
  }

  const fallback = FALLBACK_SEED_ISSUES.find(i => i.id === id) || FALLBACK_SEED_ISSUES[0]
  return NextResponse.json(fallback)
}
