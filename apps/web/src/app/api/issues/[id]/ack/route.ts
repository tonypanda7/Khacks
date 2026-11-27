import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getIssueById, upsertIssue } from '@/lib/store'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    if (!session.isLoggedIn || session.role !== 'authority') {
      return NextResponse.json({ error: 'Unauthorized. Authority account required.' }, { status: 401 })
    }

    const { id } = await params

    try {
      const issue = await prisma.issue.update({
        where: { id },
        data: { status: 'ACKNOWLEDGED' },
      })
      await prisma.event.create({
        data: { issueId: id, type: 'ACKNOWLEDGED', payload: { by: session.userId } as any }
      })
      return NextResponse.json(issue)
    } catch {
      // Offline fallback
      const issue = getIssueById(id)
      if (issue) {
        issue.status = 'ACKNOWLEDGED'
        if (!issue.events) issue.events = []
        issue.events.push({
          id: 'ev-' + Date.now(),
          type: 'ACKNOWLEDGED',
          createdAt: new Date().toISOString(),
          payload: { by: session.userId }
        })
        upsertIssue(issue)
        return NextResponse.json(issue)
      }
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
