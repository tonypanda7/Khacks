import { SessionOptions } from 'iron-session'

export interface SessionData {
  userId?: string
  role?: 'user' | 'authority'
  name?: string
  isLoggedIn: boolean
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_fixproof_2026',
  cookieName: 'fixproof-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}
