'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import exifr from 'exifr'

const LOCATION_PRESETS = [
  { name: '🏫 K.C.S. Kasi Nadar College, Chennai', lat: 13.1205, lon: 80.2805 },
  { name: '🛣️ Anna Salai / Thousand Lights', lat: 13.0528, lon: 80.2514 },
  { name: '🏢 Rajiv Gandhi Salai (OMR)', lat: 12.9620, lon: 80.2428 },
]

async function compressImageIfNeeded(file: File): Promise<Blob> {
  // If file is under 3MB, keep as is
  if (file.size <= 3 * 1024 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxDim = 2048
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
        canvas.toBlob((blob) => {
          resolve(blob || file)
        }, 'image/jpeg', 0.85)
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

      // Client-side EXIF inspection
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
      } catch (e) {
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
    setStatusMessage('Optimizing image & preparing payload...')

    try {
      // Downscale if file exceeds 3MB to avoid cloud gateway limits
      const uploadBlob = await compressImageIfNeeded(file)
      
      const formData = new FormData()
      formData.append('image', uploadBlob, 'defect.jpg')

      // Always pass coordinates (detected EXIF or chosen landmark)
      const targetLat = detectedGps?.lat ?? manualGps?.lat ?? 13.1205
      const targetLon = detectedGps?.lon ?? manualGps?.lon ?? 80.2805
      formData.append('fallbackLat', targetLat.toString())
      formData.append('fallbackLon', targetLon.toString())

      setStatusMessage('Sending to FixProof Vision AI (DeepInfra)...')

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
        throw new Error(data.error || `Upload failed (${res.status})`)
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
      setStatusMessage('')
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

      const rawText = await res.text()
      let data: any
      try {
        data = JSON.parse(rawText)
      } catch {
        throw new Error(`Confirmation server error (${res.status})`)
      }

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
          Upload an original camera photo. FixProof vision AI verifies EXIF coordinates, classifies defect severity, and pins it to the public road grid.
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

      {/* Duplicate Confirmation Dialog */}
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
            <span>✓ Report Successfully Registered & Verified by AI</span>
          </h3>
          <p className="text-sm mb-2 text-slate-300">
            {successResult.status === 'attached'
              ? 'Your photo was attached as supplemental evidence to an existing defect bundle.'
              : 'A new civic defect issue has been created and placed on the Chennai live map.'}
          </p>

          {successResult.classification && (
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3 my-3 text-xs text-slate-200 space-y-1">
              <div><strong className="text-emerald-400">AI Category:</strong> {successResult.classification.category?.toUpperCase() || 'CIVIC DEFECT'}</div>
              <div><strong className="text-emerald-400">Severity:</strong> {successResult.classification.severity_1_5 ?? 3} / 5</div>
              <div><strong className="text-emerald-400">AI Rationale:</strong> {successResult.classification.severity_rationale}</div>
            </div>
          )}

          <div className="flex space-x-3 mt-4">
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
              View Pin on Chennai Map 📍
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
                  Camera JPEGs with GPS EXIF metadata. Max 20MB.
                </p>
              </div>
            )}
          </div>

          {/* Location Verification Status */}
          {preview && (
            <div className="p-4 rounded-xl border bg-slate-800/50 border-slate-700 text-xs space-y-3">
              {detectedGps ? (
                <div className="flex items-center text-emerald-400 space-x-2 font-medium">
                  <span>📍 GPS Detected from Photo EXIF:</span>
                  <span className="font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    {detectedGps.lat.toFixed(5)}°N, {detectedGps.lon.toFixed(5)}°E
                  </span>
                </div>
              ) : hasNoExifGps ? (
                <div className="space-y-2">
                  <div className="text-amber-400 font-semibold flex items-center space-x-1">
                    <span>⚠️ No GPS metadata in photo</span>
                    <span className="text-slate-400 font-normal">(email apps and chats often scrub GPS tags)</span>
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
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
          >
            {loading ? (statusMessage || 'Analyzing with Vision AI...') : 'Submit Report for AI Verification'}
          </button>
        </form>
      )}
    </div>
  )
}
