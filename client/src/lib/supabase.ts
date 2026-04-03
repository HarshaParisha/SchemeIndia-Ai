import { createClient } from '@supabase/supabase-js'

let supabase: ReturnType<typeof createClient> | null = null

export function isSupabaseConfigured() {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
  return Boolean(url && anonKey)
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null

  if (supabase) return supabase

  const url = String(import.meta.env.VITE_SUPABASE_URL)
  const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY)
  supabase = createClient(url, anonKey)
  return supabase
}
