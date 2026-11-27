'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface IssuePin {
  id: string
  title?: string
  road?: string
  category: string
  lat: number
  lon: number
  status: string
  priorityBand: string
  priorityScore: number
  reportCount: number
  severity: number
  isSeed: boolean
  imageUrl?: string
  severityRationale?: string
  priorityRationale?: string
  reports?: any[]
  fixAttempts?: any[]
}

const OSM_STYLE: any = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const [mapLoaded, setMapLoaded] = useState(false)
  const [issues, setIssues] = useState<IssuePin[]>([])
  const [activeModalIssue, setActiveModalIssue] = useState<IssuePin | null>(null)
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

  // Open modal for issue
  const openIssueModal = async (issue: IssuePin) => {
    try {
      const res = await fetch(`/api/issues/${issue.id}`)
      if (res.ok) {
        const fullData = await res.json()
        setActiveModalIssue({ ...issue, ...fullData })
        return
      }
    } catch (e) {
      // fallback to issue in state
    }
    setActiveModalIssue(issue)
  }

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return

    let map: any = null

    const initMap = async () => {
      try {
        const maplibregl = await import('maplibre-gl')

        map = new maplibregl.Map({
          container: mapContainer.current!,
          style: OSM_STYLE,
          center: [80.2400, 13.0450], // Center of Chennai arterial grid (Anna Salai / Guindy corridor)
          zoom: 12,
        })

        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')

        map.on('load', () => {
          mapInstance.current = map
          setMapLoaded(true)
          map.resize()
        })

        const resizeObserver = new ResizeObserver(() => {
          if (map) map.resize()
        })
        if (mapContainer.current) {
          resizeObserver.observe(mapContainer.current)
        }
      } catch (e) {
        console.error('MapLibre init error:', e)
      }
    }

    initMap()

    return () => {
      if (map) {
        map.remove()
        mapInstance.current = null
      }
    }
  }, [])

  // Render teardrop pins locked to exact coordinates
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return

    const renderMarkers = async () => {
      try {
        const maplibregl = await import('maplibre-gl')

        // Remove old markers
        markersRef.current.forEach(m => m.remove())
        markersRef.current = []

        issues.forEach(issue => {
          if (!Number.isFinite(issue.lat) || !Number.isFinite(issue.lon)) return
          const color = 
            issue.status === 'FIX_VERIFIED' ? '#10b981' :
            issue.status === 'IN_PROGRESS' ? '#3b82f6' :
            issue.status === 'FIX_SUBMITTED' ? '#8b5cf6' :
            issue.status === 'FIX_REJECTED' ? '#ef4444' :
            issue.status === 'NEEDS_REVIEW' ? '#f59e0b' :
            '#f97316' // REPORTED / ROUTED

          const icon = 
            issue.category === 'pothole' ? '🕳️' :
            issue.category === 'drainage' ? '🌊' : '🗑️'

          // Outer container for MapLibre positioning (DO NOT animate this element)
          const el = document.createElement('div')
          el.className = 'maplibre-pin-anchor'
          el.style.width = '38px'
          el.style.height = '48px'
          el.style.cursor = 'pointer'

          // Inner teardrop pin with fixed tip pointing exactly to coordinates
          el.innerHTML = `
            <div class="pin-wrapper" style="
              width: 38px;
              height: 48px;
              position: relative;
              filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
              transition: transform 0.15s ease;
            ">
              <svg viewBox="0 0 38 48" width="38" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Teardrop Pin Shape -->
                <path d="M19 0C8.50659 0 0 8.50659 0 19C0 30.5 19 48 19 48C19 48 38 30.5 38 19C38 8.50659 29.4934 0 19 0Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
                <!-- Inner circle -->
                <circle cx="19" cy="18" r="13" fill="#0f172a"/>
              </svg>
              <!-- Category Icon -->
              <div style="
                position: absolute;
                top: 7px;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 15px;
                line-height: 1;
                pointer-events: none;
              ">${icon}</div>
              <!-- Report count badge -->
              <div style="
                position: absolute;
                top: -3px;
                right: -3px;
                background: #ffffff;
                color: #0f172a;
                font-size: 10px;
                font-weight: 800;
                border-radius: 9999px;
                padding: 1px 5px;
                border: 1.5px solid ${color};
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                pointer-events: none;
              ">${issue.reportCount || 1}</div>
            </div>
          `

          // Scale only the inner wrapper on hover so MapLibre's transform is NEVER displaced
          const inner = el.querySelector('.pin-wrapper') as HTMLElement
          el.onmouseenter = () => {
            if (inner) inner.style.transform = 'scale(1.2) translateY(-4px)'
          }
          el.onmouseleave = () => {
            if (inner) inner.style.transform = 'scale(1) translateY(0)'
          }

          el.addEventListener('click', (e) => {
            e.stopPropagation()
            openIssueModal(issue)
          })

          // Anchor to bottom tip of the pin
          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([issue.lon, issue.lat])
            .addTo(mapInstance.current)

          markersRef.current.push(marker)
        })
      } catch (err) {
        console.error('Error rendering pin markers:', err)
      }
    }

    renderMarkers()
  }, [mapLoaded, issues])

  return (
    <div className="flex-1 w-full h-[calc(100vh-61px)] flex overflow-hidden relative">
      {/* Top Filter Bar */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-2xl flex flex-wrap items-center gap-3 text-xs">
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Categories</option>
          <option value="pothole">Pothole (🕳️)</option>
          <option value="drainage">Drainage (🌊)</option>
          <option value="garbage">Garbage (🗑️)</option>
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
          Showing <strong className="text-white">{issues.length}</strong> Road Pins
        </div>
      </div>

      {/* Map Canvas */}
      <div 
        ref={mapContainer} 
        className="w-full h-full flex-1 bg-slate-900"
        style={{ minHeight: '500px', width: '100%', height: '100%' }}
      />

      {/* INTERACTIVE POPUP / DIALOG BOX ON PIN CLICK */}
      {activeModalIssue && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveModalIssue(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Defect Photo Banner */}
            <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-slate-800">
              <img
                src={activeModalIssue.imageUrl || activeModalIssue.reports?.[0]?.image?.path || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'}
                alt={activeModalIssue.title || 'Road defect photo'}
                className="w-full h-full object-cover"
              />
              {/* Category & Status Overlay */}
              <div className="absolute top-3 left-3 flex items-center space-x-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/75 text-emerald-400 border border-emerald-500/40 uppercase tracking-wide">
                  {activeModalIssue.category === 'pothole' ? '🕳️ Pothole' : activeModalIssue.category === 'drainage' ? '🌊 Drainage' : '🗑️ Garbage'}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  activeModalIssue.status === 'FIX_VERIFIED' ? 'bg-emerald-950 text-emerald-300 border-emerald-600' :
                  activeModalIssue.status === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-300 border-blue-600' :
                  activeModalIssue.status === 'FIX_REJECTED' ? 'bg-red-950 text-red-300 border-red-600' :
                  'bg-amber-950 text-amber-300 border-amber-600'
                }`}>
                  {activeModalIssue.status}
                </span>
              </div>
              {/* Close Button */}
              <button
                onClick={() => setActiveModalIssue(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center font-bold text-sm cursor-pointer border border-white/20"
              >
                ✕
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {activeModalIssue.title || `${activeModalIssue.category.toUpperCase()} Hazard #${activeModalIssue.id.slice(0, 8)}`}
                </h3>
                <p className="text-xs text-emerald-400 font-medium mt-0.5 flex items-center space-x-1">
                  <span>📍</span>
                  <span>{activeModalIssue.road || `Coordinates: ${activeModalIssue.lat.toFixed(4)}, ${activeModalIssue.lon.toFixed(4)}`}</span>
                </p>
              </div>

              {/* Severity & AI Priority Matrix */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">Defect Severity</span>
                  <div className="flex items-baseline space-x-1">
                    <strong className="text-lg text-white font-bold">{activeModalIssue.severity || 4}</strong>
                    <span className="text-slate-400 text-xs">/ 5</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                    {activeModalIssue.severityRationale || 'Evaluated via VLM severity rubric.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">AI Priority Score</span>
                  <div className="flex items-baseline space-x-1">
                    <strong className="text-lg text-amber-400 font-bold">{activeModalIssue.priorityScore || 75}</strong>
                    <span className="text-xs text-amber-300/80 font-semibold">({activeModalIssue.priorityBand || 'HIGH'})</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                    {activeModalIssue.priorityRationale || 'Weighted by road hierarchy and traffic.'}
                  </p>
                </div>
              </div>

              {/* Evidence Bundle Note */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                <span>Citizen Evidence Bundle: <strong>{activeModalIssue.reportCount || 1} Independent Reports</strong></span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-mono">Deduplicated</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-2">
                <Link
                  href={`/issues/${activeModalIssue.id}`}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-xl text-center text-xs border border-slate-700 transition"
                >
                  Full Evidence Audit Trail →
                </Link>
                <Link
                  href={`/fix/${activeModalIssue.id}`}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 px-4 rounded-xl text-center text-xs shadow-lg transition"
                >
                  Submit Fix Proof
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
