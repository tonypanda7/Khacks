'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface IssuePin {
  id: string
  category: string
  lat: number
  lon: number
  status: string
  priorityBand: string
  priorityScore: number
  reportCount: number
  severity: number
  isSeed: boolean
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const [issues, setIssues] = useState<IssuePin[]>([])
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)

  // Fetch map issues
  const fetchIssues = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter) params.append('category', categoryFilter)
      if (statusFilter) params.append('status', statusFilter)
      if (priorityFilter) params.append('priorityBand', priorityFilter)
      if (overdueOnly) params.append('overdue', 'true')

      const res = await fetch(`/api/map?${params.toString()}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setIssues(data)
      }
    } catch (err) {
      console.error('Failed fetching map issues:', err)
    }
  }

  useEffect(() => {
    fetchIssues()
  }, [categoryFilter, statusFilter, priorityFilter, overdueOnly])

  // Fetch issue detail on pin select
  const selectIssue = async (id: string) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/issues/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedIssue(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return

    let isMounted = true

    const initMap = async () => {
      const maplibregl = await import('maplibre-gl')

      if (mapInstance.current) return

      const map = new maplibregl.Map({
        container: mapContainer.current!,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [80.2500, 13.0650], // Chennai center
        zoom: 12,
      })

      map.addControl(new maplibregl.NavigationControl(), 'top-right')
      mapInstance.current = map
    }

    initMap().catch(console.error)

    return () => {
      isMounted = false
    }
  }, [])

  // Render markers whenever issues or map changes
  useEffect(() => {
    if (!mapInstance.current) return

    const renderMarkers = async () => {
      const maplibregl = await import('maplibre-gl')

      // Remove existing markers
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      issues.forEach(issue => {
        // Status color mapping
        const color = 
          issue.status === 'FIX_VERIFIED' ? '#10b981' :
          issue.status === 'IN_PROGRESS' ? '#3b82f6' :
          issue.status === 'FIX_SUBMITTED' ? '#8b5cf6' :
          issue.status === 'FIX_REJECTED' ? '#ef4444' :
          issue.status === 'NEEDS_REVIEW' ? '#f59e0b' :
          '#f97316' // REPORTED / ROUTED

        // Ring size by priority band
        const ringSize =
          issue.priorityBand === 'CRITICAL' ? 'ring-4 ring-red-500 ring-offset-2 ring-offset-slate-900 animate-pulse' :
          issue.priorityBand === 'HIGH' ? 'ring-2 ring-amber-400' : ''

        const el = document.createElement('div')
        el.className = `cursor-pointer rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg transition-transform hover:scale-125 ${ringSize}`
        el.style.backgroundColor = color
        el.style.width = '30px'
        el.style.height = '30px'
        el.style.border = '2px solid white'
        el.innerText = String(issue.reportCount || 1)
        el.title = `${issue.category} · Status: ${issue.status}`

        el.addEventListener('click', () => {
          selectIssue(issue.id)
        })

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([issue.lon, issue.lat])
          .addTo(mapInstance.current)

        markersRef.current.push(marker)
      })
    }

    renderMarkers()
  }, [issues])

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Filters Overlay */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-xl flex flex-wrap items-center gap-3 text-xs">
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Categories</option>
          <option value="pothole">Pothole</option>
          <option value="drainage">Drainage</option>
          <option value="garbage">Garbage</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="REPORTED">Reported</option>
          <option value="ROUTED">Routed</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="FIX_SUBMITTED">Fix Submitted</option>
          <option value="FIX_VERIFIED">Fix Verified</option>
          <option value="FIX_REJECTED">Fix Rejected</option>
          <option value="NEEDS_REVIEW">Needs Review</option>
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={e => setOverdueOnly(e.target.checked)}
            className="rounded border-slate-700 text-emerald-500 focus:ring-0"
          />
          <span>Overdue Only</span>
        </label>

        <div className="border-l border-slate-700 pl-3 text-slate-400">
          Showing <strong className="text-white">{issues.length}</strong> issues
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainer} className="flex-1 w-full h-full" />

      {/* Side Panel for Issue Detail */}
      {selectedIssue && (
        <div className="w-96 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto z-20 flex flex-col shadow-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="uppercase text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {selectedIssue.category}
                </span>
                {selectedIssue.isSeed && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                    SEED
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Issue #{selectedIssue.id.slice(0, 8)}</h2>
            </div>
            <button
              onClick={() => setSelectedIssue(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Status & Priority Badge */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Status</span>
              <span className="font-semibold text-white">{selectedIssue.status}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800">
              <span className="text-slate-400 block mb-0.5">AI Priority</span>
              <span className="font-semibold text-amber-400">
                {selectedIssue.priorityScore ?? '--'}/100 ({selectedIssue.priorityBand || 'PENDING'})
              </span>
            </div>
          </div>

          {/* Evidence Bundle Gallery */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Citizen Evidence Bundle ({selectedIssue.reports?.length || 0} Reports)
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {selectedIssue.reports?.map((r: any, idx: number) => (
                <div key={r.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                  <img
                    src={`/api/images${r.image?.path}`}
                    alt={`Report ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback placeholder
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23334155"><rect width="100" height="100"/></svg>'
                    }}
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white px-1 rounded">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Rationale */}
          <div className="mb-4 p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs space-y-2">
            <div>
              <span className="font-semibold text-slate-300">Severity Assessment: </span>
              <span className="text-slate-400">{selectedIssue.severityRationale || 'Severity calculated from image features.'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-300">Priority Rationale: </span>
              <span className="text-slate-400">{selectedIssue.priorityRationale || 'Awaiting multi-factor context rating.'}</span>
            </div>
          </div>

          {/* Action Link */}
          <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center">
            <Link
              href={`/issues/${selectedIssue.id}`}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Full Evidence & Audit Trail →
            </Link>
            <Link
              href={`/fix/${selectedIssue.id}`}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
            >
              Submit Fix
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
