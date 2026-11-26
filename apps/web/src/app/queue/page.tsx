'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AuthorityQueuePage() {
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/queue')
      if (res.status === 401) {
        setError('Unauthorized: Please login as authority_demo')
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setQueue(data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  const handleAction = async (id: string, action: 'ack' | 'start') => {
    setActionLoading(`${id}-${action}`)
    try {
      const res = await fetch(`/api/issues/${id}/${action}`, { method: 'POST' })
      if (!res.ok) throw new Error('Action failed')
      await fetchQueue()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Authority Repair Queue</h1>
          <p className="text-sm text-slate-400 mt-1">
            Prioritized by AI severity, public transit proximity, and SLA risk score.
          </p>
        </div>
        <div className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400">
          Ranked items: <strong className="text-white">{queue.length}</strong>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-sm">
          <p className="font-semibold mb-2">{error}</p>
          <Link href="/login" className="underline font-bold text-amber-200">
            Go to Login Page →
          </Link>
        </div>
      ) : loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          Loading prioritized work orders...
        </div>
      ) : queue.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
          No open defects in queue. All issues resolved!
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((issue) => (
            <div
              key={issue.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start space-x-4">
                {/* Priority Badge */}
                <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-amber-400">{issue.priorityScore ?? '--'}</span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tighter">
                    {issue.priorityBand || 'MED'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="uppercase text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {issue.category}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold px-2 py-0.5 rounded bg-slate-800">
                      {issue.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {issue.reportCount} report(s)
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white mt-1">Issue #{issue.id.slice(0, 8)}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {issue.priorityRationale || issue.severityRationale || 'Assigned to municipal dispatch.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                {issue.status === 'REPORTED' || issue.status === 'ROUTED' ? (
                  <button
                    onClick={() => handleAction(issue.id, 'ack')}
                    disabled={actionLoading === `${issue.id}-ack`}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    {actionLoading === `${issue.id}-ack` ? 'Updating...' : 'Acknowledge'}
                  </button>
                ) : null}

                {issue.status === 'ACKNOWLEDGED' || issue.status === 'FIX_REJECTED' ? (
                  <button
                    onClick={() => handleAction(issue.id, 'start')}
                    disabled={actionLoading === `${issue.id}-start`}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
                  >
                    {actionLoading === `${issue.id}-start` ? 'Updating...' : 'Start Work'}
                  </button>
                ) : null}

                <Link
                  href={`/fix/${issue.id}`}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  Submit Fix Proof
                </Link>

                <Link
                  href={`/issues/${issue.id}`}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
