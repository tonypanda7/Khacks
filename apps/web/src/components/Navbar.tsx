'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ name?: string; role?: string; isLoggedIn?: boolean } | null>(null)
  const [aiOnline, setAiOnline] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/login/me')
      .then(r => r.json())
      .then(data => setUser(data))
      .catch(() => setUser(null))

    // Check AI health
    fetch('http://localhost:8000/health', { method: 'GET' })
      .then(r => r.ok ? setAiOnline(true) : setAiOnline(false))
      .catch(() => setAiOnline(false))
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/login/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-6">
        <Link href="/map" className="flex items-center space-x-2 font-bold text-lg text-emerald-400 tracking-wide">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>FixProof</span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">Chennai</span>
        </Link>
        <nav className="flex space-x-4 text-sm font-medium">
          <Link href="/map" className={`px-3 py-1.5 rounded-md transition ${pathname === '/map' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:text-white'}`}>
            Live Map
          </Link>
          <Link href="/upload" className={`px-3 py-1.5 rounded-md transition ${pathname === '/upload' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:text-white'}`}>
            Report Issue
          </Link>
          {user?.role === 'authority' && (
            <Link href="/queue" className={`px-3 py-1.5 rounded-md transition ${pathname === '/queue' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:text-white'}`}>
              Authority Queue
            </Link>
          )}
          <Link href="/metrics" className={`px-3 py-1.5 rounded-md transition ${pathname === '/metrics' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:text-white'}`}>
            Metrics & Eval
          </Link>
        </nav>
      </div>

      <div className="flex items-center space-x-4 text-xs">
        {/* AI Service Status Pill */}
        <div className={`px-2.5 py-1 rounded-full flex items-center space-x-1.5 border ${
          aiOnline === true ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
          aiOnline === false ? 'bg-amber-950 text-amber-300 border-amber-700' :
          'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${aiOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <span>{aiOnline ? 'AI Vision Online' : 'AI Offline (Degraded)'}</span>
        </div>

        {user?.isLoggedIn ? (
          <div className="flex items-center space-x-3 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-slate-400">
              Role: <strong className="text-emerald-300 capitalize">{user.role}</strong> ({user.name})
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
    </header>
  )
}
