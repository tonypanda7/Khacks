'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import exifr from 'exifr'
import { formatCategory } from '@/lib/category'

const LOCATION_PRESETS = [
  { name: '🏫 K.C.S. Kasi Nadar College, Chennai', lat: 13.1205, lon: 80.2805 },
  { name: '🛣️ Anna Salai / Thousand Lights', lat: 13.0528, lon: 80.2514 },
  { name: '🏢 Rajiv Gandhi Salai (OMR)', lat: 12.9620, lon: 80.2428 },
]

// Convert and compress ANY image to lightning-fast WebP before uploading
async function convertAndCompressToWebP(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxDim = 1400 // Optimal balance of high-res defect cues and ultra-light payload
      let width = img.width
      let height = img.height
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            resolve(blob || file)
          },
          'image/webp',
          0.82
        )
      } else {
        resolve(file)
      }
    }
    img.onerror = () => resolve(file)
    img.src = url
  })
}

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [detectedGps, setDetectedGps] = useState<{ lat: number; lon: number } | null>(null)
  const [manualGps, setManualGps] = useState<{ lat: number; lon: number } | null>(null)
  const [locationName, setLocationName] = useState<string>('')
  const [hasNoExifGps, setHasNoExifGps] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [duplicatePrompt, setDuplicatePrompt] = useState<any | null>(null)
  const [successResult, setSuccessResult] = useState<any | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        setError('Please select an image file directly from your camera or gallery.')
        setFile(null)
        setPreview(null)
        return
      }
      setFile(selected)
      setError(null)
      const url = URL.createObjectURL(selected)
      setPreview(url)

      // Client-side EXIF inspection before compression
      try {
        const parsed = await exifr.parse(selected, { gps: true })
        const lat = Number(parsed?.latitude)
        const lon = Number(parsed?.longitude)
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          setDetectedGps({ lat, lon })
          setHasNoExifGps(false)
        } else {
          setDetectedGps(null)
          setHasNoExifGps(true)
          setManualGps({ lat: 13.1205, lon: 80.2805 })
          setLocationName('🏫 K.C.S. Kasi Nadar College, Chennai')
        }
      } catch {
        setDetectedGps(null)
        setHasNoExifGps(true)
        setManualGps({ lat: 13.1205, lon: 80.2805 })
        setLocationName('🏫 K.C.S. Kasi Nadar College, Chennai')
      }
    }
  }

  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setManualGps({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setLocationName(`📍 Current Device Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`)
      },
      (err) => {
        setError('Could not access device location: ' + err.message)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)
    setStatusMessage('Compressing image to WebP & extracting metadata...')

    try {
      // 1. Convert to high-speed WebP to minimize latency and mobile data
      const webpBlob = await convertAndCompressToWebP(file)
      
      const formData = new FormData()
      formData.append('image', webpBlob, 'defect.webp')

      // 2. Always pass coordinates (detected EXIF or chosen landmark)
      const targetLat = detectedGps?.lat ?? manualGps?.lat ?? 13.1205
      const targetLon = detectedGps?.lon ?? manualGps?.lon ?? 80.2805
      formData.append('fallbackLat', targetLat.toString())
      formData.append('fallbackLon', targetLon.toString())

      setStatusMessage('Sending to FixProof Vision AI...')

      const res = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      })

      const rawText = await res.text()
      let data: any
      try {
        data = JSON.parse(rawText)
      } catch {
        if (res.status === 413) {
          throw new Error('Image file is too large for the server. Please select a smaller photo.')
        }
        if (res.status === 401) {
          throw new Error('Please sign in or refresh the page to submit.')
        }
        throw new Error(`Server returned error (${res.status}). Please try again.`)
      }

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed')
      }

      // Check if duplicate prompt is required
      if (data.status === 'confirm_duplicate') {
        setDuplicatePrompt(data)
        return
      }

      setSuccessResult({
        status: data.status,
        issueId: data.issueId,
        classification: data.classification,
      })
    } catch (err: any) {
      setError(err.message || 'Error uploading report')
    } finally {
      setLoading(false)
      setStatusMessage('')
    }
  }

  const handleDuplicateConfirm = async (action: 'attach' | 'new') => {
    if (!duplicatePrompt?.reportId) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/${duplicatePrompt.reportId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process confirmation')
      }

      setSuccessResult({
        status: action === 'attach' ? 'attached' : 'created',
        issueId: data.issueId,
        classification: duplicatePrompt.classification,
      })
      setDuplicatePrompt(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const catMeta = successResult?.classification?.category 
    ? formatCategory(successResult.classification.category) 
    : null

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Report Road / Civic Hazard</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload an original camera photo. Vision AI detects potholes, road collapse, fallen power lines, drainage leaks, or any civic damage.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs sm:text-sm flex items-start space-x-3">
          <span className="text-lg">⚠️</span>
          <div>
            <strong className="block font-semibold">Submission Rejected</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Duplicate Confirmation Dialog */}
      {duplicatePrompt && (
        <div className="mb-6 p-4 sm:p-5 bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-xl">
          <div className="flex items-center space-x-2 text-amber-400 font-bold mb-3 text-sm sm:text-base">
            <span>🔍 Possible Duplicate Defect Nearby</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20">
              Confidence: {Math.round((duplicatePrompt.candidateIssue?.probability || 0.6) * 100)}%
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-4">
            An open issue was reported within 40m of your coordinates. Does your photo depict the same hazard?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
            <div className="border border-slate-700 rounded-xl p-3 bg-slate-800/50 text-center">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Existing Issue #{duplicatePrompt.candidateIssue?.id.slice(0, 8)}</span>
              <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-700 mb-2">
                <img
                  src={duplicatePrompt.candidateIssue?.refImagePath?.startsWith('http') ? duplicatePrompt.candidateIssue?.refImagePath : `/api/images${duplicatePrompt.candidateIssue?.refImagePath}`}
                  alt="Existing reference"
                  className="w-full h-full object-cover"
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

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleDuplicateConfirm('attach')}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-xl text-xs sm:text-sm transition cursor-pointer"
            >
              Yes — Add as Evidence to Existing Issue
            </button>
            <button
              onClick={() => handleDuplicateConfirm('new')}
              disabled={loading}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-xl text-xs sm:text-sm transition border border-slate-700 cursor-pointer"
            >
              No — This is a Different Defect
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successResult && (
        <div className="mb-6 p-4 sm:p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-emerald-300">
          <h3 className="font-bold text-base sm:text-lg mb-1 flex items-center space-x-2">
            <span>✓ Report Verified by AI & Stored as Fast WebP</span>
          </h3>
          <p className="text-xs sm:text-sm mb-2 text-slate-300">
            {successResult.status === 'attached'
              ? 'Your photo was attached as supplemental evidence to an existing defect bundle.'
              : 'A new civic defect issue has been created and placed on the Chennai live map.'}
          </p>

          {successResult.classification && (
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3 my-3 text-xs text-slate-200 space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{catMeta?.icon || '⚠️'}</span>
                <div>
                  <strong className="text-emerald-400">Category:</strong> {catMeta?.label || successResult.classification.category}
                </div>
              </div>
              <div><strong className="text-emerald-400">Severity:</strong> {successResult.classification.severity_1_5 ?? 3} / 5</div>
              <div><strong className="text-emerald-400">AI Rationale:</strong> {successResult.classification.severity_rationale}</div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={() => router.push(`/issues/${successResult.issueId}`)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer text-center"
            >
              View Issue & Evidence Bundle →
            </button>
            <button
              onClick={() => router.push('/map')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer text-center"
            >
              View Pin on Chennai Map 📍
            </button>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {!duplicatePrompt && !successResult && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6">
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 sm:p-8 text-center transition cursor-pointer relative">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="Upload preview" className="max-h-56 sm:max-h-72 mx-auto rounded-lg shadow-md border border-slate-700" />
                <p className="text-xs text-slate-400">Tap or drag another photo to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-xl text-slate-400">
                  📸
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Tap to capture photo or choose from gallery
                </div>
                <p className="text-xs text-slate-500">
                  Camera photos with GPS EXIF metadata. Auto-optimized to WebP.
                </p>
              </div>
            )}
          </div>

          {/* Location Verification Status */}
          {preview && (
            <div className="p-3 sm:p-4 rounded-xl border bg-slate-800/50 border-slate-700 text-xs space-y-3">
              {detectedGps ? (
                <div className="flex flex-wrap items-center text-emerald-400 gap-2 font-medium">
                  <span>📍 GPS Detected from Photo EXIF:</span>
                  <span className="font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    {detectedGps.lat.toFixed(5)}°N, {detectedGps.lon.toFixed(5)}°E
                  </span>
                </div>
              ) : hasNoExifGps ? (
                <div className="space-y-2">
                  <div className="text-amber-400 font-semibold flex items-center space-x-1">
                    <span>⚠️ No GPS metadata in photo</span>
                    <span className="text-slate-400 font-normal">(messaging apps often scrub GPS)</span>
                  </div>
                  <p className="text-slate-300">
                    Pin location for map placement: <strong className="text-emerald-400">{locationName || 'Select Below'}</strong>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {LOCATION_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setManualGps({ lat: p.lat, lon: p.lon })
                          setLocationName(p.name)
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                          manualGps?.lat === p.lat
                            ? 'bg-emerald-600/30 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleUseDeviceLocation}
                      className="px-3 py-1.5 rounded-lg border bg-blue-600/20 border-blue-500 text-blue-300 hover:bg-blue-600/30 text-xs transition cursor-pointer"
                    >
                      📍 Use Device GPS
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer text-sm sm:text-base"
          >
            {loading ? (statusMessage || 'Analyzing with Vision AI...') : 'Submit Report for AI Verification'}
          </button>
        </form>
      )}
    </div>
  )
}
