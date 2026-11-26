import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    if (!session.isLoggedIn || session.role !== 'authority') {
      return NextResponse.json({ error: 'Unauthorized. Authority account required.' }, { status: 401 })
    }

    const { id } = await params
    const issue = await prisma.issue.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    })
    await prisma.event.create({
      data: { issueId: id, type: 'WORK_STARTED', payload: { by: session.userId } as any }
    })
    return NextResponse.json(issue)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
