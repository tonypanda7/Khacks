import fs from 'fs'
import path from 'path'
import { FALLBACK_SEED_ISSUES } from './mock-data'

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
const STORE_PATH = process.env.LOCAL_STORE_PATH || (
  isServerless
    ? '/tmp/fixproof_local_store.json'
    : path.join(process.cwd(), 'data', 'local_store.json')
)

export interface StoreIssue {
  id: string
  title?: string
  road?: string
  category: string
  lat: number
  lon: number
  status: string
  priorityScore: number
  priorityBand: string
  priorityRationale?: string
  severity: number
  severityRationale?: string
  reportCount: number
  isSeed?: boolean
  flags?: string[]
  imageUrl?: string
  createdAt: string
  reports?: any[]
  events?: any[]
  fixAttempts?: any[]
}

let memoryStore: StoreIssue[] | null = null

function ensureStoreDir() {
  try {
    const dir = path.dirname(STORE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  } catch {
    // Ignore read-only filesystem errors
  }
}

export function getAllIssues(): StoreIssue[] {
  if (memoryStore && memoryStore.length > 0) {
    return memoryStore
  }

  try {
    ensureStoreDir()
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf-8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryStore = parsed
        return parsed
      }
    }
  } catch (err) {
    console.warn('Store file read fallback:', err)
  }

  // Initialize with seed issues
  const initial = [...FALLBACK_SEED_ISSUES] as StoreIssue[]
  memoryStore = initial
  try {
    ensureStoreDir()
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8')
  } catch {
    // Read-only filesystem — kept in memoryStore
  }
  return initial
}

export function saveAllIssues(issues: StoreIssue[]): void {
  memoryStore = issues
  try {
    ensureStoreDir()
    fs.writeFileSync(STORE_PATH, JSON.stringify(issues, null, 2), 'utf-8')
  } catch (err) {
    console.warn('Filesystem write deferred (in-memory mode):', err)
  }
}

export function getIssueById(id: string): StoreIssue | null {
  const issues = getAllIssues()
  return issues.find(i => i.id === id) || null
}

export function upsertIssue(issue: StoreIssue): StoreIssue {
  const issues = getAllIssues()
  const idx = issues.findIndex(i => i.id === issue.id)
  if (idx >= 0) {
    issues[idx] = { ...issues[idx], ...issue }
  } else {
    issues.unshift(issue) // newest first
  }
  saveAllIssues(issues)
  return issue
}

export function addReport(issueId: string, report: any): void {
  const issues = getAllIssues()
  const issue = issues.find(i => i.id === issueId)
  if (issue) {
    if (!issue.reports) issue.reports = []
    issue.reports.unshift(report)
    issue.reportCount = issue.reports.length
    if (report.image?.path && !issue.imageUrl) {
      issue.imageUrl = `/api/images${report.image.path}`
    }
    saveAllIssues(issues)
  }
}

export function addFixAttempt(issueId: string, fixAttempt: any): void {
  const issues = getAllIssues()
  const issue = issues.find(i => i.id === issueId)
  if (issue) {
    if (!issue.fixAttempts) issue.fixAttempts = []
    issue.fixAttempts.unshift(fixAttempt)
    if (fixAttempt.decision === 'ACCEPTED' || fixAttempt.decision === 'APPROVED') {
      issue.status = 'FIX_VERIFIED'
    } else if (fixAttempt.decision === 'REJECTED') {
      issue.status = 'FIX_REJECTED'
    }
    saveAllIssues(issues)
  }
}
