import type { Scheme } from '@/types/api'

import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

type Profile = {
  userType?: string
  state?: string
  district?: string
  age?: number
  income?: number
  casteCategory?: string
  gender?: string
}

function currentUserNamespace() {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem('bharatcare_mock_user') : null
  if (!raw) return 'anon'
  try {
    const u = JSON.parse(raw) as any
    const email = String(u?.primaryEmailAddress?.emailAddress || u?.email || 'anon').toLowerCase()
    return email.replace(/[^a-z0-9]+/g, '_').slice(0, 60) || 'anon'
  } catch {
    return 'anon'
  }
}

type ListParams = {
  q?: string
  page?: number
  pageSize?: number
  category?: string
  state?: string
  scope?: 'central' | 'state'
  onlyEligible?: boolean
}

type SchemeRow = {
  id: string
  name: string
  ministry: string
  state: string | null
  category: string
  description: string
  benefit: string
  eligibility: Scheme['eligibility']
  documents: string[]
  application_steps: string[]
  official_link: string
  deadline: string | null
  updated_at: string | null
}

function readProfile(): Profile | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(`bc_${currentUserNamespace()}_profile`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Profile
  } catch {
    return null
  }
}

function matchSchemeQuery(s: Scheme, q: string) {
  const t = q.trim().toLowerCase()
  if (!t) return true
  return (
    s.name.toLowerCase().includes(t) ||
    s.ministry.toLowerCase().includes(t) ||
    s.category.toLowerCase().includes(t) ||
    (s.state || '').toLowerCase().includes(t)
  )
}

function withinEligibility(s: Scheme, profile: Profile | null) {
  if (!profile) return true
  const e = s.eligibility || {}
  if (e.userType && profile.userType && !e.userType.includes(profile.userType)) return false
  if (e.states && profile.state && !e.states.includes(profile.state)) return false
  if (e.gender && profile.gender && !e.gender.includes(profile.gender)) return false
  if (e.casteCategory && profile.casteCategory && !e.casteCategory.includes(profile.casteCategory)) return false
  if (typeof e.minAge === 'number' && typeof profile.age === 'number' && profile.age < e.minAge) return false
  if (typeof e.maxAge === 'number' && typeof profile.age === 'number' && profile.age > e.maxAge) return false
  if (typeof e.maxIncome === 'number' && typeof profile.income === 'number' && profile.income > e.maxIncome) return false
  return true
}

function rowToScheme(row: SchemeRow): Scheme {
  return {
    id: row.id,
    name: row.name,
    ministry: row.ministry,
    state: row.state,
    category: row.category,
    description: row.description,
    benefit: row.benefit,
    eligibility: row.eligibility || {},
    documents: Array.isArray(row.documents) ? row.documents : [],
    applicationSteps: Array.isArray(row.application_steps) ? row.application_steps : [],
    officialLink: row.official_link,
    deadline: row.deadline ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

async function loadLocalSchemes() {
  const mod = await import('@/data/schemes')
  return mod.SCHEMES as Scheme[]
}

async function listSchemesLocal(params: ListParams) {
  const profile = readProfile()
  const q = (params.q || '').trim()
  const page = Math.max(1, params.page || 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 12))

  let items = (await loadLocalSchemes()).slice()
  if (q) items = items.filter((s) => matchSchemeQuery(s, q))
  if (params.category) items = items.filter((s) => s.category === params.category)
  if (params.state) items = items.filter((s) => (s.state ? s.state === params.state : true))
  if (params.scope === 'central') items = items.filter((s) => s.state === null)
  if (params.scope === 'state') items = items.filter((s) => s.state !== null)
  if (params.onlyEligible) items = items.filter((s) => withinEligibility(s, profile))

  const total = items.length
  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)
  return { items: pageItems, total, page, pageSize }
}

async function listSchemesSupabase(params: ListParams) {
  const supabase = getSupabaseClient()
  if (!supabase) return listSchemesLocal(params)

  const q = (params.q || '').trim()
  const page = Math.max(1, params.page || 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 12))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('schemes').select('*', { count: 'exact' })

  if (q) query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' })
  if (params.category) query = query.eq('category', params.category)

  if (params.scope === 'central') query = query.is('state', null)
  if (params.scope === 'state') query = query.not('state', 'is', null)

  if (params.state) {
    if (params.scope === 'state') {
      query = query.eq('state', params.state)
    } else {
      query = query.or(`state.eq.${params.state},state.is.null`)
    }
  }

  const { data, error, count } = await query.order('name', { ascending: true }).range(from, to)
  if (error || !data) return listSchemesLocal(params)

  let items = (data as SchemeRow[]).map(rowToScheme)

  if (params.onlyEligible) {
    const profile = readProfile()
    items = items.filter((s) => withinEligibility(s, profile))
  }

  return {
    items,
    total: typeof count === 'number' ? count : items.length,
    page,
    pageSize,
  }
}

export const schemesRepo = {
  isRemoteEnabled: isSupabaseConfigured,
  async listSchemes(params: ListParams) {
    return listSchemesSupabase(params)
  },
  async getScheme(id: string) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      const schemes = await loadLocalSchemes()
      return schemes.find((s) => s.id === id) || null
    }

    const { data, error } = await supabase.from('schemes').select('*').eq('id', id).maybeSingle()
    if (error || !data) {
      const schemes = await loadLocalSchemes()
      return schemes.find((s) => s.id === id) || null
    }
    return rowToScheme(data as SchemeRow)
  },
}
