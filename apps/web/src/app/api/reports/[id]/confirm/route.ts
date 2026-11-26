import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { action } = await req.json() // 'attach' or 'new'

    const report = await prisma.report.findUnique({ 
      where: { id },
      include: { issue: true }
    })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (action === 'attach') {
      await prisma.issue.update({
        where: { id: report.issueId },
        data: { reportCount: { increment: 1 } },
      })
      await prisma.event.create({
        data: {
          issueId: report.issueId,
          type: 'REPORT_ATTACHED_CONFIRMED',
          payload: { reportId: id } as any,
        }
      })
      return NextResponse.json({ status: 'attached', issueId: report.issueId })
    } else {
      const issue = await prisma.issue.create({
        data: {
          category: report.issue.category,
          lat: report.lat,
          lon: report.lon,
          status: 'REPORTED',
          severity: report.issue.severity,
          reportCount: 1,
        }
      })
      await prisma.report.update({
        where: { id },
        data: { issueId: issue.id },
      })
      await prisma.event.create({
        data: {
          issueId: issue.id,
          type: 'ISSUE_CREATED',
          payload: { fromDuplicateRejection: true } as any,
        }
      })
      return NextResponse.json({ status: 'created', issueId: issue.id })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
