import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json()

    if (!['user', 'authority'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const name = role === 'user' ? 'user_demo' : 'authority_demo'
    
    let user = await prisma.user.findFirst({ where: { name, role } })
    if (!user) {
      user = await prisma.user.create({ data: { name, role } })
    }

    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    session.userId = user.id
    session.role = user.role
    session.name = user.name
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({ userId: user.id, role: user.role, name: user.name })
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 })
  }
}
