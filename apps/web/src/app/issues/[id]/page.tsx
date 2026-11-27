'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatCategory } from '@/lib/category'

export default function IssueDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [issue, setIssue] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/issues/${id}`)
      .then(async r => {
        if (!r.ok) throw new Error('Issue not found')
        return r.json()
      })
      .then(data => setIssue(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
        Loading issue bundle and audit log...
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="flex-1 p-8 text-center">
        <p className="text-red-400 mb-4">{error || 'Issue not found'}</p>
        <Link href="/map" className="text-emerald-400 underline text-sm">
          Return to Map
        </Link>
      </div>
    )
  }

  const latestFixAttempt = issue.fixAttempts?.[0]

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            {(() => {
              const cat = formatCategory(issue.category)
              return (
                <span className={`uppercase text-xs font-bold px-2 py-0.5 rounded ${cat.bgClass} ${cat.textClass} border ${cat.borderClass} flex items-center space-x-1`}>
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </span>
              )
            })()}
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
              issue.status === 'FIX_VERIFIED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
              issue.status === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-300 border border-blue-700' :
              issue.status === 'FIX_REJECTED' ? 'bg-red-950 text-red-300 border border-red-700' :
              'bg-amber-950 text-amber-300 border border-amber-700'
            }`}>
              {issue.status}
            </span>
            {issue.isSeed && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                SEED DATA
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Issue #{issue.id}</h1>
          <p className="text-xs text-slate-400">
            Coordinates: {issue.lat.toFixed(5)}, {issue.lon.toFixed(5)} · Reported {new Date(issue.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex space-x-3">
          <Link
            href={`/fix/${issue.id}`}
            className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition"
          >
            Submit Fix Proof
          </Link>
        </div>
      </div>

      {/* Grid: AI Analysis & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Severity Rating</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{issue.severity ?? 3}</span>
            <span className="text-xs text-slate-500">/ 5 (Vision AI Rubric)</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{issue.severityRationale || 'Computed from defect geometry & hazard context.'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">AI Priority Score</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-400">{issue.priorityScore ?? 50}</span>
            <span className="text-xs text-slate-500">/ 100 ({issue.priorityBand || 'MEDIUM'})</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{issue.priorityRationale || 'Dynamic score combining location, traffic, & rain risk.'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Evidence Bundle Size</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">{issue.reportCount}</span>
            <span className="text-xs text-slate-500">Citizen Reports</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Deduplicated across multiple viewpoints and angles.</p>
        </div>
      </div>

      {/* Citizen Evidence Bundle Gallery */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Citizen Evidence Bundle ({issue.reports?.length || 0} Reports)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {issue.reports?.map((report: any, idx: number) => (
            <div key={report.id} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60 p-3">
              <div className="aspect-video rounded bg-slate-900 overflow-hidden mb-2 relative">
                <img
                  src={`/api/images${report.image?.path}`}
                  alt={`Report ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%231e293b"><text x="10" y="50" fill="%2394a3b8">Seed Photo</text></svg>'
                  }}
                />
                <span className="absolute top-2 left-2 text-[10px] bg-black/80 text-white px-1.5 py-0.5 rounded font-mono">
                  Report #{idx + 1}
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-400">
                <div>Captured: {report.capturedAt ? new Date(report.capturedAt).toLocaleString() : 'N/A'}</div>
                <div className="font-mono text-[10px] truncate text-slate-500">SHA: {report.image?.sha256}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proof-of-Fix Verification Receipt (if any fix attempt) */}
      {latestFixAttempt && (
        <div className="bg-slate-900 border-2 border-purple-500/30 rounded-xl p-5 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-2">
              <span>🛡️ Proof-of-Fix Cryptographic Verification</span>
            </h2>
            <span className={`text-xs px-2.5 py-1 rounded font-bold ${
              latestFixAttempt.decision === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' :
              latestFixAttempt.decision === 'REJECTED' ? 'bg-red-950 text-red-300 border border-red-600' :
              'bg-amber-950 text-amber-300 border border-amber-600'
            }`}>
              Decision: {latestFixAttempt.decision || 'PROCESSING'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Fix Score</span>
              <strong className="text-sm text-white">{(latestFixAttempt.fixScore ?? 0).toFixed(3)}</strong>
            </div>
            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Threshold (Approve)</span>
              <span className="text-slate-300">≥ 0.75</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Pair Comparisons</span>
              <span className="text-slate-300">{latestFixAttempt.pairOutputs?.length || 0} Evaluated</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Guard Rule</span>
              <span className="text-emerald-400 font-semibold">Proof-of-Fix Enforced</span>
            </div>
          </div>

          {/* Pairwise comparisons list */}
          {latestFixAttempt.pairOutputs && (
            <div className="space-y-2 mb-4">
              <span className="text-xs font-semibold text-slate-400">Pairwise Bundle Judgements:</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {latestFixAttempt.pairOutputs.map((pair: any, i: number) => (
                  <div key={i} className="text-xs p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300">
                      Fix Image vs Reference #{i + 1}: Loc Prob: <strong>{(pair.same_location_prob * 100).toFixed(0)}%</strong>, Repaired Prob: <strong>{(pair.defect_repaired_prob * 100).toFixed(0)}%</strong>
                    </span>
                    <span className="font-mono text-purple-400 text-xs">Score: {(pair.pair_score).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON Receipt Drawer */}
          {latestFixAttempt.receipt && (
            <details className="text-xs text-slate-400 cursor-pointer">
              <summary className="hover:text-white font-medium">View Full Cryptographic Audit Receipt (JSON)</summary>
              <pre className="mt-2 p-3 rounded bg-slate-950 text-slate-300 font-mono text-[10px] overflow-x-auto border border-slate-800">
                {JSON.stringify(latestFixAttempt.receipt, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Lifecycle Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Lifecycle Audit Trail</h2>
        <div className="space-y-3">
          {issue.events?.map((ev: any) => (
            <div key={ev.id} className="flex items-start space-x-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5"></div>
              <div>
                <strong className="text-white mr-2">{ev.type}</strong>
                <span className="text-slate-500">{new Date(ev.createdAt).toLocaleString()}</span>
                {ev.payload && (
                  <div className="text-slate-400 font-mono text-[10px] mt-0.5">
                    {JSON.stringify(ev.payload)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
