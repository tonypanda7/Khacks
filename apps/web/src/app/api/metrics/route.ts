import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [totalIssues, totalReports, totalFixes, issuesByCategory, issuesByStatus, avgFixScore, aiRuns] = await Promise.all([
      prisma.issue.count({ where: { isSeed: false } }),
      prisma.report.count(),
      prisma.fixAttempt.count(),
      prisma.issue.groupBy({ by: ['category'], _count: true, where: { isSeed: false } }),
      prisma.issue.groupBy({ by: ['status'], _count: true, where: { isSeed: false } }),
      prisma.fixAttempt.aggregate({ _avg: { fixScore: true }, where: { fixScore: { not: null } } }),
      prisma.aiRun.count(),
    ])

    const metricsRuns = await prisma.metricsRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      summary: {
        totalIssues,
        totalReports,
        totalFixes,
        avgFixScore: avgFixScore._avg.fixScore ?? 0,
        totalAiRuns: aiRuns,
      },
      byCategory: issuesByCategory,
      byStatus: issuesByStatus,
      evaluations: metricsRuns,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
