import mongoose from 'mongoose'

import { SchemeModel, type SchemeDoc } from '../models/Scheme.js'
import { loadSchemes as loadLegacySchemes, matchSchemes as matchLegacySchemes } from './schemeMatcherService.js'

export type ListSchemesParams = {
  q?: string
  category?: string
  state?: string
  governmentLevel?: 'central' | 'state'
  ministry?: string
  status?: 'active' | 'upcoming' | 'expired'
  sort?: 'relevant' | 'newest' | 'highestBenefit'
  page: number
  pageSize: number
}

type ListedScheme = Pick<
  SchemeDoc,
  | 'id'
  | 'name'
  | 'slug'
  | 'governmentLevel'
  | 'state'
  | 'ministry'
  | 'department'
  | 'category'
  | 'subcategory'
  | 'status'
  | 'lastUpdated'
  | 'shortDescription'
  | 'benefits'
  | 'tags'
  | 'isVerified'
  | 'viewCount'
  | 'savedCount'
>

function parseRupeeAmount(text: string): number {
  const t = String(text || '')
    .toLowerCase()
    .replace(/,/g, '')
    .trim()
  const m = t.match(/(₹|rs\.?|inr)\s*([0-9]+(?:\.[0-9]+)?)\s*(lakh|lac|crore|cr)?/i)
  if (!m) return 0
  const n = Number(m[2] || 0)
  if (!Number.isFinite(n)) return 0
  const unit = (m[3] || '').toLowerCase()
  if (unit === 'lakh' || unit === 'lac') return n * 100000
  if (unit === 'crore' || unit === 'cr') return n * 10000000
  return n
}

function schemeMaxBenefitAmount(s: Pick<SchemeDoc, 'benefits'>): number {
  let best = 0
  for (const b of s.benefits || []) {
    best = Math.max(best, parseRupeeAmount(b.amount), parseRupeeAmount(b.description))
  }
  return best
}

function isMongoReady() {
  return mongoose.connection.readyState === 1
}

function legacyToListed(): ListedScheme[] {
  const legacy = loadLegacySchemes()
  return legacy.map((s) => {
    const governmentLevel: 'central' | 'state' = s.state ? 'state' : 'central'
    return {
      id: s.id,
      name: s.name,
      slug: s.id,
      governmentLevel,
      state: s.state,
      ministry: s.ministry,
      department: '',
      category: s.category,
      subcategory: '',
      status: 'active',
      lastUpdated: new Date(),
      shortDescription: s.description,
      benefits: [{ type: 'benefit', description: s.benefit, amount: '', frequency: '' }],
      tags: [],
      isVerified: false,
      viewCount: 0,
      savedCount: 0,
    }
  })
}

export async function listSchemes(params: ListSchemesParams) {
  if (!isMongoReady()) {
    const q = (params.q || '').trim().toLowerCase()
    let items = legacyToListed()
    if (q) items = items.filter((s) => s.name.toLowerCase().includes(q) || s.shortDescription.toLowerCase().includes(q))
    if (params.category) items = items.filter((s) => s.category === params.category)
    if (params.ministry) items = items.filter((s) => s.ministry === params.ministry)
    if (params.governmentLevel) items = items.filter((s) => s.governmentLevel === params.governmentLevel)
    if (params.state) items = items.filter((s) => (s.governmentLevel === 'central' ? true : s.state === params.state))
    if (params.sort === 'highestBenefit') items = [...items].sort((a, b) => schemeMaxBenefitAmount(b) - schemeMaxBenefitAmount(a))
    if (params.sort === 'newest') items = [...items].sort((a, b) => +new Date(b.lastUpdated) - +new Date(a.lastUpdated))

    const total = items.length
    const start = (params.page - 1) * params.pageSize
    const pageItems = items.slice(start, start + params.pageSize)
    return { items: pageItems, total }
  }

  const q = (params.q || '').trim()
  const filter: Record<string, unknown> = {}
  if (params.category) filter.category = params.category
  if (params.ministry) filter.ministry = params.ministry
  if (params.governmentLevel) filter.governmentLevel = params.governmentLevel
  if (params.status) filter.status = params.status
  if (params.state) filter.state = params.state

  const find = q
    ? { ...filter, $text: { $search: q } }
    : filter

  const projection: Record<string, unknown> = {
    id: 1,
    name: 1,
    slug: 1,
    governmentLevel: 1,
    state: 1,
    ministry: 1,
    department: 1,
    category: 1,
    subcategory: 1,
    status: 1,
    lastUpdated: 1,
    shortDescription: 1,
    benefits: 1,
    tags: 1,
    isVerified: 1,
    viewCount: 1,
    savedCount: 1,
  }
  if (q) projection.score = { $meta: 'textScore' }

  let query = SchemeModel.find(find, projection)
  if (params.sort === 'newest') query = query.sort({ lastUpdated: -1 })
  else if (params.sort === 'relevant' && q) query = query.sort({ score: { $meta: 'textScore' } })
  else query = query.sort({ isVerified: -1, savedCount: -1, lastUpdated: -1 })

  const skip = (params.page - 1) * params.pageSize
  const [items, total] = await Promise.all([
    query.skip(skip).limit(params.pageSize).lean<ListedScheme[]>(),
    SchemeModel.countDocuments(find),
  ])

  if (params.sort === 'highestBenefit') {
    const sorted = [...items].sort((a, b) => schemeMaxBenefitAmount(b) - schemeMaxBenefitAmount(a))
    return { items: sorted, total }
  }

  return { items, total }
}

export async function getSchemeByIdOrSlug(idOrSlug: string) {
  if (!isMongoReady()) {
    const schemes = loadLegacySchemes()
    const legacy = schemes.find((s) => s.id === idOrSlug)
    if (!legacy) return null
    const governmentLevel: 'central' | 'state' = legacy.state ? 'state' : 'central'
    const scheme: SchemeDoc = {
      id: legacy.id,
      name: legacy.name,
      slug: legacy.id,
      governmentLevel,
      state: legacy.state,
      ministry: legacy.ministry,
      department: '',
      category: legacy.category,
      subcategory: '',
      launchYear: new Date().getFullYear(),
      lastUpdated: new Date(),
      status: 'active',
      shortDescription: legacy.description,
      fullDescription: legacy.description,
      benefits: [{ type: 'benefit', description: legacy.benefit, amount: '', frequency: '' }],
      eligibility: {
        minAge: legacy.eligibility?.minAge ?? null,
        maxAge: legacy.eligibility?.maxAge ?? null,
        gender: 'all',
        casteCategories: legacy.eligibility?.casteCategory ?? [],
        maxAnnualIncome: legacy.eligibility?.maxIncome ?? null,
        employmentStatus: legacy.eligibility?.userType ?? [],
        requiredConditions: [],
        excludedConditions: [],
      },
      documents: (legacy.documents || []).map((d) => ({ name: d, mandatory: true, description: '' })),
      applicationProcess: {
        mode: 'online',
        steps: legacy.applicationSteps || [],
        onlinePortalUrl: legacy.officialLink || '',
        offlineFormUrl: '',
        helplineNumber: '',
      },
      tags: [],
      searchKeywords: [],
      beneficiaryCount: 0,
      viewCount: 0,
      savedCount: 0,
      isVerified: false,
      createdAt: new Date(),
    }
    return scheme
  }

  return SchemeModel.findOne({ $or: [{ id: idOrSlug }, { slug: idOrSlug }] }).lean<SchemeDoc | null>()
}

export type MatchInput = {
  state?: string
  age?: number
  gender?: 'male' | 'female' | 'all'
  casteCategory?: string
  annualIncome?: number
  userType?: string
  conditions?: string[]
  needs?: string[]
}

function normalizeNeed(s: string) {
  return String(s || '').trim().toLowerCase()
}

function schemeHasNeed(scheme: SchemeDoc, need: string) {
  const n = normalizeNeed(need)
  if (!n) return false
  const hay = [scheme.category, scheme.subcategory, scheme.ministry, ...(scheme.tags || []), ...(scheme.searchKeywords || [])]
    .join(' ')
    .toLowerCase()
  return hay.includes(n)
}

function eligibleForScheme(scheme: SchemeDoc, input: MatchInput) {
  const e = scheme.eligibility
  if (typeof input.age === 'number') {
    if (typeof e.minAge === 'number' && e.minAge !== null && input.age < e.minAge) return false
    if (typeof e.maxAge === 'number' && e.maxAge !== null && input.age > e.maxAge) return false
  }
  if (typeof input.annualIncome === 'number' && typeof e.maxAnnualIncome === 'number' && e.maxAnnualIncome !== null) {
    if (input.annualIncome > e.maxAnnualIncome) return false
  }
  if (input.gender && input.gender !== 'all' && e.gender !== 'all' && input.gender !== e.gender) return false
  if (input.casteCategory && Array.isArray(e.casteCategories) && e.casteCategories.length > 0) {
    if (!e.casteCategories.includes(input.casteCategory)) return false
  }
  if (Array.isArray(e.excludedConditions) && e.excludedConditions.length > 0 && Array.isArray(input.conditions)) {
    for (const c of input.conditions) if (e.excludedConditions.includes(c)) return false
  }
  if (scheme.governmentLevel === 'state' && input.state && scheme.state && scheme.state !== input.state) return false
  return true
}

function scoreScheme(scheme: SchemeDoc, input: MatchInput) {
  if (!eligibleForScheme(scheme, input)) return null

  let score = 0

  if (input.state && scheme.governmentLevel === 'state' && scheme.state === input.state) score += 30

  if (typeof input.age === 'number') {
    const e = scheme.eligibility
    const inRange =
      (e.minAge === null || input.age >= e.minAge) &&
      (e.maxAge === null || input.age <= e.maxAge)
    if (inRange) score += 20
  }
  if (typeof input.annualIncome === 'number') {
    const e = scheme.eligibility
    if (e.maxAnnualIncome === null || input.annualIncome <= e.maxAnnualIncome) score += 20
  }
  if (input.casteCategory) {
    const e = scheme.eligibility
    if (!e.casteCategories?.length || e.casteCategories.includes(input.casteCategory)) score += 15
  }
  if (input.gender && input.gender !== 'all') {
    const e = scheme.eligibility
    if (e.gender === 'all' || e.gender === input.gender) score += 10
  }
  if (input.userType) {
    const e = scheme.eligibility
    if (!e.employmentStatus?.length || e.employmentStatus.includes(input.userType)) score += 15
  }
  if (Array.isArray(input.conditions) && input.conditions.length > 0) {
    const required = scheme.eligibility.requiredConditions || []
    const matches = input.conditions.filter((c) => required.includes(c)).length
    score += matches * 5
  }

  if (Array.isArray(input.needs) && input.needs.length > 0) {
    if (input.needs.some((n) => normalizeNeed(n) === 'all' || normalizeNeed(n) === 'everything')) {
      score += 10
    } else if (input.needs.some((n) => schemeHasNeed(scheme, n))) {
      score += 10
    }
  }

  return score
}

function toPctScore(raw: number, input: MatchInput) {
  const condCount = Array.isArray(input.conditions) ? input.conditions.length : 0
  const needsActive = Array.isArray(input.needs) && input.needs.length > 0
  const max = 30 + 20 + 20 + 15 + 15 + 10 + condCount * 5 + (needsActive ? 10 : 0)
  if (!max) return 0
  return Math.max(0, Math.min(100, Math.round((raw / max) * 100)))
}

export type MatchScheme = ListedScheme & { matchScore: number }

function toMatchScheme(s: SchemeDoc, matchScore: number): MatchScheme {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    governmentLevel: s.governmentLevel,
    state: s.state,
    ministry: s.ministry,
    department: s.department,
    category: s.category,
    subcategory: s.subcategory,
    status: s.status,
    lastUpdated: s.lastUpdated,
    shortDescription: s.shortDescription,
    benefits: s.benefits,
    tags: s.tags,
    isVerified: s.isVerified,
    viewCount: s.viewCount,
    savedCount: s.savedCount,
    matchScore,
  }
}

export async function matchSchemes(input: MatchInput) {
  if (!isMongoReady()) {
    const legacyMatches = matchLegacySchemes({
      userType: input.userType,
      state: input.state,
      age: input.age,
      income: input.annualIncome,
      casteCategory: input.casteCategory,
      gender: input.gender,
    })
    const centralMatches: MatchScheme[] = []
    const stateMatches: MatchScheme[] = []
    for (const s of legacyMatches) {
      const governmentLevel: 'central' | 'state' = s.state ? 'state' : 'central'
      const base: MatchScheme = {
        id: s.id,
        name: s.name,
        slug: s.id,
        governmentLevel,
        state: s.state,
        ministry: s.ministry,
        department: '',
        category: s.category,
        subcategory: '',
        status: 'active',
        lastUpdated: new Date(),
        shortDescription: s.description,
        benefits: [{ type: 'benefit', description: s.benefit, amount: '', frequency: '' }],
        tags: [],
        isVerified: false,
        viewCount: 0,
        savedCount: 0,
        matchScore: 0,
      }
      if (governmentLevel === 'central') centralMatches.push(base)
      else stateMatches.push(base)
    }
    return { centralMatches, stateMatches }
  }

  const baseFilter: Record<string, unknown> = { status: 'active' }
  if (input.state) baseFilter.$or = [{ governmentLevel: 'central' }, { governmentLevel: 'state', state: input.state }]
  else baseFilter.governmentLevel = 'central'

  const candidates = await SchemeModel.find(baseFilter).limit(800).lean<SchemeDoc[]>()
  const scored: Array<{ scheme: SchemeDoc; matchScore: number }> = []
  for (const s of candidates) {
    const raw = scoreScheme(s, input)
    if (raw === null) continue
    scored.push({ scheme: s, matchScore: toPctScore(raw, input) })
  }
  scored.sort((a, b) => b.matchScore - a.matchScore)

  const centralMatches: MatchScheme[] = []
  const stateMatches: MatchScheme[] = []
  for (const x of scored) {
    const out = toMatchScheme(x.scheme, x.matchScore)
    if (x.scheme.governmentLevel === 'central') centralMatches.push(out)
    else stateMatches.push(out)
  }
  return { centralMatches, stateMatches }
}

export async function suggestSearch(q: string) {
  const query = q.trim()
  if (!query) return { schemes: [], categories: [], ministries: [] }

  if (!isMongoReady()) {
    const items = legacyToListed()
      .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10)
      .map((s) => ({ id: s.id, name: s.name, slug: s.slug, governmentLevel: s.governmentLevel, state: s.state }))
    return { schemes: items, categories: [], ministries: [] }
  }

  const schemes = await SchemeModel.find({ $text: { $search: query } }, { score: { $meta: 'textScore' }, id: 1, name: 1, slug: 1, governmentLevel: 1, state: 1 })
    .sort({ score: { $meta: 'textScore' } })
    .limit(10)
    .lean()

  const [categories, ministries] = await Promise.all([
    SchemeModel.distinct('category', { category: new RegExp(query, 'i') }).then((v) => v.slice(0, 10)),
    SchemeModel.distinct('ministry', { ministry: new RegExp(query, 'i') }).then((v) => v.slice(0, 10)),
  ])

  return { schemes, categories, ministries }
}
