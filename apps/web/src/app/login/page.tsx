'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (role: 'user' | 'authority') => {
    setLoading(role)
    setError(null)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }
      if (role === 'authority') {
        router.push('/queue')
      } else {
        router.push('/map')
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(null)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-4">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">FixProof Demo Portal</h1>
        <p className="text-slate-400 text-sm mb-6">
          K! Hacks 4.0 Prototype · Civic Defect Evidence Bundling & Proof-of-Fix
        </p>

        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs mb-6 text-left">
          <strong>Demo Notice:</strong> No passwords required. Click either account to authenticate immediately via signed session cookie.
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/50 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-white">Citizen Account</span>
              <span className="font-mono text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">user_demo</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Upload geotagged defect photos, view live city map, explore deduplicated evidence bundles.</p>
            <button
              onClick={() => handleLogin('user')}
              disabled={loading !== null}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              {loading === 'user' ? 'Logging in...' : 'Continue as User'}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/50 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-white">Authority Account</span>
              <span className="font-mono text-xs bg-slate-800 text-purple-400 px-2 py-0.5 rounded border border-slate-700">authority_demo</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Access prioritized repair queue, acknowledge/start works, and submit fix photos to AI Proof-of-Fix.</p>
            <button
              onClick={() => handleLogin('authority')}
              disabled={loading !== null}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              {loading === 'authority' ? 'Logging in...' : 'Continue as Authority'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
