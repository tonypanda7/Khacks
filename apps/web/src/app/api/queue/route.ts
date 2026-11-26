import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    if (!session.isLoggedIn || session.role !== 'authority') {
      return NextResponse.json({ error: 'Unauthorized. Authority account required.' }, { status: 401 })
    }

    const issues = await prisma.issue.findMany({
      where: {
        status: { in: ['REPORTED', 'ROUTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'FIX_REJECTED', 'NEEDS_REVIEW'] },
      },
      include: {
        reports: {
          include: { image: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { priorityScore: 'desc' },
    })

    return NextResponse.json(issues)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
