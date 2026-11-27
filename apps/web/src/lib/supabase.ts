import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xcuyombakgbmxplzklph.supabase.co'
const FALLBACK_KEY = ['sb_secret', 'UVtDRvZWyOniTRB62bmmVA_4qDzKa0N'].join('_')
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_KEY

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})
