'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicatePrompt, setDuplicatePrompt] = useState<any | null>(null)
  const [successResult, setSuccessResult] = useState<any | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (!selected.type.startsWith('image/jpeg') && !selected.type.startsWith('image/jpg')) {
        setError('Please select a JPEG image directly from your camera.')
        setFile(null)
        setPreview(null)
        return
      }
      setFile(selected)
      setError(null)
      const url = URL.createObjectURL(selected)
      setPreview(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report')
      }

      if (data.status === 'confirm_duplicate') {
        setDuplicatePrompt(data)
      } else {
        setSuccessResult(data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicateConfirm = async (action: 'attach' | 'new') => {
    if (!duplicatePrompt?.reportId) return
    setLoading(true)

    try {
      const res = await fetch(`/api/reports/${duplicatePrompt.reportId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Confirmation failed')

      setSuccessResult({
        status: action === 'attach' ? 'attached' : 'created',
        issueId: data.issueId,
      })
      setDuplicatePrompt(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Report Road Hazard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload an original geotagged camera photo. Our vision AI verifies EXIF coordinates, classifies defect severity, and links evidence bundles.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start space-x-3">
          <span className="text-lg">⚠️</span>
          <div>
            <strong className="block font-semibold">Submission Rejected</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Duplicate Confirmation Dialog (Same pothole?) */}
      {duplicatePrompt && (
        <div className="mb-6 p-5 bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-xl">
          <div className="flex items-center space-x-2 text-amber-400 font-bold mb-3">
            <span>🔍 Possible Duplicate Defect Detected</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20">
              Confidence: {Math.round((duplicatePrompt.candidateIssue?.probability || 0.6) * 100)}%
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-4">
            An open issue was reported within 40m of your coordinates. Does your photo show the exact same defect?
          </p>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="border border-slate-700 rounded-xl p-3 bg-slate-800/50 text-center">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Existing Issue #{duplicatePrompt.candidateIssue?.id.slice(0, 8)}</span>
              <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-700 mb-2">
                <img
                  src={`/api/images${duplicatePrompt.candidateIssue?.refImagePath}`}
                  alt="Existing reference"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23334155"><text x="10" y="50" fill="%23fff">Reference Photo</text></svg>'
                  }}
                />
              </div>
              <span className="text-xs text-slate-400">{duplicatePrompt.candidateIssue?.reportCount} prior report(s)</span>
            </div>

            <div className="border border-emerald-500/40 rounded-xl p-3 bg-emerald-950/20 text-center">
              <span className="text-xs font-semibold text-emerald-400 block mb-2">Your Photo</span>
              <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-700 mb-2">
                {preview && <img src={preview} alt="Your submission" className="w-full h-full object-cover" />}
              </div>
              <span className="text-xs text-emerald-400">Classified: {duplicatePrompt.classification?.category}</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleDuplicateConfirm('attach')}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-xl text-sm transition cursor-pointer"
            >
              Yes — Add as Evidence to Existing Issue
            </button>
            <button
              onClick={() => handleDuplicateConfirm('new')}
              disabled={loading}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 px-4 rounded-xl text-sm transition border border-slate-700 cursor-pointer"
            >
              No — This is a Different Defect
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successResult && (
        <div className="mb-6 p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-emerald-300">
          <h3 className="font-bold text-lg mb-1 flex items-center space-x-2">
            <span>✓ Report Successfully Registered</span>
          </h3>
          <p className="text-sm mb-4">
            {successResult.status === 'attached'
              ? 'Your photo was attached as supplemental evidence to an existing defect bundle.'
              : 'A new civic defect issue has been created, classified, and scheduled for department routing.'}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/issues/${successResult.issueId}`)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              View Issue & Evidence Bundle →
            </button>
            <button
              onClick={() => router.push('/map')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              Return to Map
            </button>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {!duplicatePrompt && !successResult && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-8 text-center transition cursor-pointer relative">
            <input
              type="file"
              accept="image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="Upload preview" className="max-h-64 mx-auto rounded-lg shadow-md border border-slate-700" />
                <p className="text-xs text-slate-400">Click or drag another JPEG to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  📷
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Click to select JPEG or drag & drop camera photo
                </div>
                <p className="text-xs text-slate-500">
                  Original bytes with GPS EXIF metadata required. Max 20MB.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
          >
            {loading ? 'Analyzing EXIF & Running Vision AI...' : 'Submit Report for AI Verification'}
          </button>
        </form>
      )}
    </div>
  )
}
