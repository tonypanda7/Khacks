'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SubmitFixPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()

  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      if (selected.length > 5) {
        setError('Maximum 5 fix photos allowed.')
        return
      }
      setFiles(selected)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('images', f))

      const res = await fetch(`/api/issues/${id}/fix`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit fix photos')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <Link href={`/issues/${id}`} className="text-xs text-slate-400 hover:text-white mb-2 inline-block">
          ← Back to Issue #{id.slice(0, 8)}
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Submit Proof-of-Fix</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload 1–5 original photos of the repaired road hazard. Our AI pairwise engine validates location context and defect remediation against the citizen evidence bundle.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start space-x-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`mb-6 p-6 rounded-2xl border ${
          result.decision === 'APPROVED' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' :
          result.decision === 'REJECTED' ? 'bg-red-950/40 border-red-500/50 text-red-300' :
          'bg-amber-950/40 border-amber-500/50 text-amber-300'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <span>{result.decision === 'APPROVED' ? '✓ Repair Verified & Closed' :
                     result.decision === 'REJECTED' ? '✕ Fix Verification Rejected' :
                     '⚠️ Sent for Manual Review'}</span>
            </h2>
            <span className="font-mono text-sm px-2.5 py-1 rounded bg-black/40 border border-current font-semibold">
              Fix Score: {result.fixScore !== undefined ? result.fixScore.toFixed(3) : '--'}
            </span>
          </div>

          <p className="text-sm mb-4">
            {result.decision === 'APPROVED'
              ? 'Vision AI confirmed high confidence of defect remediation at the verified GPS location against the evidence bundle.'
              : result.decision === 'REJECTED'
              ? 'Verification score was below acceptance threshold (0.35). The repair could not be confirmed or the location did not match the original defect.'
              : 'Score fell in ambiguous range (0.35 - 0.75). The issue has been moved to NEEDS_REVIEW.'}
          </p>

          {result.receipt && (
            <div className="p-3 bg-black/50 rounded-xl text-xs font-mono text-slate-300 border border-slate-800 mb-4">
              <div>Receipt ID: {result.receipt.fix_attempt_id}</div>
              <div>Model: {result.receipt.model}</div>
              <div>Pairs Evaluated: {result.receipt.pair_count}</div>
              <div>Prompt Hash: {result.receipt.prompt_hash}</div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/issues/${id}`)}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              View Updated Issue Detail →
            </button>
            <button
              onClick={() => router.push('/queue')}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              Return to Queue
            </button>
          </div>
        </div>
      )}

      {!result && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-2 border-dashed border-slate-700 hover:border-purple-500/50 rounded-xl p-8 text-center transition cursor-pointer relative">
            <input
              type="file"
              accept="image/jpeg,image/jpg"
              multiple
              onChange={handleFiles}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {files.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-purple-400">
                  {files.length} photo(s) selected
                </div>
                <ul className="text-xs text-slate-400">
                  {files.map((f, i) => (
                    <li key={i}>{f.name} ({(f.size / (1024 * 1024)).toFixed(2)} MB)</li>
                  ))}
                </ul>
                <p className="text-xs text-slate-500">Click to re-select</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  🛠️
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Select 1–5 camera JPEG fix photos
                </div>
                <p className="text-xs text-slate-500">
                  Must contain camera GPS EXIF data and timestamp after initial defect report.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={files.length === 0 || loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
          >
            {loading ? 'Evaluating Proof-of-Fix Bundle...' : 'Submit to Proof-of-Fix Verifier'}
          </button>
        </form>
      )}
    </div>
  )
}
