import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIssueById } from '@/lib/store'

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

  const issue = getIssueById(id)
  if (issue) {
    return NextResponse.json(issue)
  }

  return NextResponse.json({ error: `Issue ${id} not found` }, { status: 404 })
}
