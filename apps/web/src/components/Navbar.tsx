'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ name?: string; role?: string; isLoggedIn?: boolean } | null>(null)
  const [aiOnline, setAiOnline] = useState<boolean | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/login/me')
      .then(r => r.json())
      .then(data => setUser(data))
      .catch(() => setUser(null))

    // Check AI health via Next.js backend (works on mobile, localhost & Vercel)
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setAiOnline(Boolean(data.aiOnline)))
      .catch(() => setAiOnline(false))
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/login/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-6">
          <Link href="/map" className="flex items-center space-x-2 font-bold text-base sm:text-lg text-emerald-400 tracking-wide">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>FixProof</span>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">Chennai</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-3 text-sm font-medium">
            <Link href="/map" className={`px-3 py-1.5 rounded-md transition ${pathname === '/map' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'}`}>
              Live Map
            </Link>
            <Link href="/upload" className={`px-3 py-1.5 rounded-md transition ${pathname === '/upload' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'}`}>
              Report Hazard
            </Link>
            {user?.role === 'authority' && (
              <Link href="/queue" className={`px-3 py-1.5 rounded-md transition ${pathname === '/queue' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'}`}>
                Authority Queue
              </Link>
            )}
            <Link href="/metrics" className={`px-3 py-1.5 rounded-md transition ${pathname === '/metrics' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'}`}>
              Metrics
            </Link>
          </nav>
        </div>

        {/* Right Desktop Controls */}
        <div className="hidden md:flex items-center space-x-3 text-xs">
          {/* AI Service Status Pill */}
          <div className={`px-2.5 py-1 rounded-full flex items-center space-x-1.5 border ${
            aiOnline === true ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
            aiOnline === false ? 'bg-amber-950 text-amber-300 border-amber-700' :
            'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${aiOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>{aiOnline ? 'AI Vision Online' : 'AI Offline'}</span>
          </div>

          {user?.isLoggedIn ? (
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">
                <strong className="text-emerald-300 capitalize">{user.role}</strong> ({user.name})
              </span>
              <button 
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 underline font-semibold ml-2 cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md font-semibold">
              Demo Login
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${aiOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 cursor-pointer"
            aria-label="Toggle mobile navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-2 text-sm animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/map"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg ${pathname === '/map' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-200'}`}
          >
            🗺️ Live Road Map
          </Link>
          <Link
            href="/upload"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg ${pathname === '/upload' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-200'}`}
          >
            📸 Report Hazard
          </Link>
          {user?.role === 'authority' && (
            <Link
              href="/queue"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg ${pathname === '/queue' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-200'}`}
            >
              📋 Authority Queue
            </Link>
          )}
          <Link
            href="/metrics"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg ${pathname === '/metrics' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-200'}`}
          >
            📊 Metrics & Evaluation
          </Link>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              AI Vision: <strong className={aiOnline ? 'text-emerald-400' : 'text-amber-400'}>{aiOnline ? 'Online' : 'Degraded'}</strong>
            </span>
            {user?.isLoggedIn ? (
              <button onClick={handleLogout} className="text-red-400 font-semibold cursor-pointer">
                Logout ({user.name})
              </button>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-emerald-400 font-semibold">
                Login →
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
