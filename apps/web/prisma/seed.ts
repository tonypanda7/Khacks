import { PrismaClient, IssueCategory, IssueStatus, PriorityBand } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const SEED_ISSUES = [
  { category: 'pothole' as IssueCategory, lat: 13.0827, lon: 80.2707, severity: 4, status: 'REPORTED' as IssueStatus, priority: 78, band: 'HIGH' as PriorityBand },
  { category: 'pothole' as IssueCategory, lat: 13.0604, lon: 80.2496, severity: 3, status: 'ROUTED' as IssueStatus, priority: 55, band: 'MEDIUM' as PriorityBand },
  { category: 'drainage' as IssueCategory, lat: 13.0878, lon: 80.2785, severity: 5, status: 'ACKNOWLEDGED' as IssueStatus, priority: 92, band: 'CRITICAL' as PriorityBand },
  { category: 'garbage' as IssueCategory, lat: 13.0524, lon: 80.2508, severity: 2, status: 'IN_PROGRESS' as IssueStatus, priority: 35, band: 'MEDIUM' as PriorityBand },
  { category: 'pothole' as IssueCategory, lat: 13.0674, lon: 80.2376, severity: 4, status: 'FIX_SUBMITTED' as IssueStatus, priority: 65, band: 'HIGH' as PriorityBand },
  { category: 'drainage' as IssueCategory, lat: 13.0756, lon: 80.2611, severity: 3, status: 'FIX_VERIFIED' as IssueStatus, priority: 40, band: 'MEDIUM' as PriorityBand },
  { category: 'garbage' as IssueCategory, lat: 13.0912, lon: 80.2893, severity: 4, status: 'REPORTED' as IssueStatus, priority: 70, band: 'HIGH' as PriorityBand },
  { category: 'pothole' as IssueCategory, lat: 13.0481, lon: 80.2399, severity: 5, status: 'ROUTED' as IssueStatus, priority: 88, band: 'CRITICAL' as PriorityBand },
  { category: 'drainage' as IssueCategory, lat: 13.0695, lon: 80.2545, severity: 2, status: 'ACKNOWLEDGED' as IssueStatus, priority: 28, band: 'LOW' as PriorityBand },
  { category: 'pothole' as IssueCategory, lat: 13.0834, lon: 80.2422, severity: 3, status: 'IN_PROGRESS' as IssueStatus, priority: 50, band: 'MEDIUM' as PriorityBand },
  { category: 'garbage' as IssueCategory, lat: 13.0567, lon: 80.2678, severity: 1, status: 'REPORTED' as IssueStatus, priority: 15, band: 'LOW' as PriorityBand },
  { category: 'pothole' as IssueCategory, lat: 13.0623, lon: 80.2812, severity: 4, status: 'FIX_REJECTED' as IssueStatus, priority: 73, band: 'HIGH' as PriorityBand },
  { category: 'drainage' as IssueCategory, lat: 13.0789, lon: 80.2456, severity: 5, status: 'NEEDS_REVIEW' as IssueStatus, priority: 85, band: 'CRITICAL' as PriorityBand },
  { category: 'garbage' as IssueCategory, lat: 13.0945, lon: 80.2567, severity: 3, status: 'ROUTED' as IssueStatus, priority: 45, band: 'MEDIUM' as PriorityBand },
  { category: 'pothole' as IssueCategory, lat: 13.0712, lon: 80.2634, severity: 2, status: 'REPORTED' as IssueStatus, priority: 22, band: 'LOW' as PriorityBand },
  { category: 'drainage' as IssueCategory, lat: 13.0856, lon: 80.2345, severity: 4, status: 'ACKNOWLEDGED' as IssueStatus, priority: 68, band: 'HIGH' as PriorityBand },
  { category: 'pothole' as IssueCategory, lat: 13.0534, lon: 80.2789, severity: 3, status: 'IN_PROGRESS' as IssueStatus, priority: 52, band: 'MEDIUM' as PriorityBand },
  { category: 'garbage' as IssueCategory, lat: 13.0678, lon: 80.2423, severity: 5, status: 'REPORTED' as IssueStatus, priority: 90, band: 'CRITICAL' as PriorityBand },
  { category: 'pothole' as IssueCategory, lat: 13.0801, lon: 80.2567, severity: 1, status: 'ROUTED' as IssueStatus, priority: 12, band: 'LOW' as PriorityBand },
  { category: 'drainage' as IssueCategory, lat: 13.0623, lon: 80.2890, severity: 3, status: 'FIX_SUBMITTED' as IssueStatus, priority: 48, band: 'MEDIUM' as PriorityBand },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Demo users
  const userDemo = await prisma.user.upsert({
    where: { id: 'user_demo' },
    update: {},
    create: { id: 'user_demo', name: 'user_demo', role: 'user' },
  })

  const authorityDemo = await prisma.user.upsert({
    where: { id: 'authority_demo' },
    update: {},
    create: { id: 'authority_demo', name: 'authority_demo', role: 'authority' },
  })
  console.log(`  ✓ Demo Users: ${userDemo.name}, ${authorityDemo.name}`)

  // Seed authorities
  const authPath = path.resolve(__dirname, '../../../data/authorities.json')
  if (fs.existsSync(authPath)) {
    const authList = JSON.parse(fs.readFileSync(authPath, 'utf-8'))
    for (const auth of authList) {
      await prisma.authority.upsert({
        where: { id: auth.id },
        update: {},
        create: auth,
      })
    }
    console.log(`  ✓ Authorities seeded: ${authList.length}`)
  }

  // Seed 20 issues
  for (const seed of SEED_ISSUES) {
    const issue = await prisma.issue.create({
      data: {
        category: seed.category,
        lat: seed.lat,
        lon: seed.lon,
        status: seed.status,
        severity: seed.severity,
        priorityScore: seed.priority,
        priorityBand: seed.band,
        priorityRationale: `[SEED] Priority ${seed.priority}/100 assessed from severity ${seed.severity}/5 on primary thoroughfare.`,
        reportCount: Math.floor(Math.random() * 4) + 1,
        isSeed: true,
        slaDueAt: new Date(Date.now() + 72 * 3600 * 1000),
      }
    })

    const image = await prisma.image.create({
      data: {
        kind: 'report',
        path: '/seed/placeholder.jpg',
        sha256: `seed_sha_${issue.id}`,
        exif: { lat: seed.lat, lon: seed.lon, DateTimeOriginal: new Date().toISOString() } as any,
      }
    })

    await prisma.report.create({
      data: {
        issueId: issue.id,
        userId: userDemo.id,
        imageId: image.id,
        lat: seed.lat,
        lon: seed.lon,
        classification: { category: seed.category, severity_1_5: seed.severity, is_seed: true } as any,
      }
    })

    await prisma.event.create({
      data: {
        issueId: issue.id,
        type: 'ISSUE_CREATED',
        payload: { isSeed: true } as any,
      }
    })
  }

  console.log(`  ✓ Created ${SEED_ISSUES.length} seed issues marked with isSeed=true`)
  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
