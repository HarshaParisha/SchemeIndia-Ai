import type { Scheme } from '@/types/api'

import { SCHEMES } from '@/data/schemes'
import { dishaIntro, dishaReply } from './mockDisha'
import { readJSON, removeKey, sleep, uid, writeJSON } from './storage'

type Profile = {
  name?: string
  email?: string
  userType?: string
  state?: string
  district?: string
  age?: number
  income?: number
  casteCategory?: string
  gender?: string
  needsSelected?: string[]
  situation?: string
  createdAt?: string
  lastActive?: string
  wellnessStreak?: number
  totalDishaConversations?: number
}

type SchemeApplication = {
  id: string
  schemeId: string
  schemeName: string
  status: 'Applied' | 'Pending' | 'Approved'
  appliedAt: string
  updatedAt: string
  notes?: string
}

type SavedScheme = { schemeId: string; savedAt: string; applicationStatus?: 'saved' | 'applied' | 'approved' | 'rejected'; notes?: string }

type MoodEntry = { id: string; mood: number; note?: string; timestamp: string }
type JournalEntry = { id: string; title: string; body: string; wordCount: number; createdAt: string }
type DishaMessage = { role: 'user' | 'assistant'; content: string; timestamp: string }
type DocumentItem = { id: string; filename: string; summary: string; createdAt: string }

const BASE = {
  profile: 'profile',
  saved: 'saved_schemes',
  applications: 'scheme_applications',
  mood: 'mood_entries',
  journal: 'journal_entries',
  disha: 'disha_messages',
  docs: 'document_history',
} as const

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

function k(name: keyof typeof BASE) {
  return `bc_${currentUserNamespace()}_${BASE[name]}`
}

function now() {
  return new Date().toISOString()
}

function wordCount(body: string) {
  return body.trim().split(/\s+/).filter(Boolean).length
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

export const mockApi = {
  async getProfile() {
    await sleep(250)
    return readJSON<Profile | null>(k('profile'), null)
  },

  async updateProfile(patch: Partial<Profile>) {
    await sleep(300)
    const existing = readJSON<Profile | null>(k('profile'), null)
    const base = existing || ({ createdAt: now(), wellnessStreak: 0, totalDishaConversations: 0 } satisfies Profile)
    const next = { ...base, ...patch, lastActive: now() }
    writeJSON(k('profile'), next)
    return next
  },

  async resetAll() {
    await sleep(120)
    ;(Object.keys(BASE) as Array<keyof typeof BASE>).forEach((name) => removeKey(k(name)))
  },

  async listSchemes(params: {
    q?: string
    page?: number
    pageSize?: number
    category?: string
    state?: string
    scope?: 'central' | 'state'
    onlyEligible?: boolean
  }) {
    await sleep(260)
    const profile = readJSON<Profile | null>(k('profile'), null)
    const q = (params.q || '').trim()
    const page = Math.max(1, params.page || 1)
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 12))

    let items = SCHEMES.slice()
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
  },

  async getScheme(id: string) {
    await sleep(220)
    const scheme = SCHEMES.find((s) => s.id === id) || null
    return scheme
  },

  async saveScheme(schemeId: string) {
    await sleep(180)
    const list = readJSON<SavedScheme[]>(k('saved'), [])
    if (!list.some((s) => s.schemeId === schemeId)) {
      list.unshift({ schemeId, savedAt: now(), applicationStatus: 'saved' })
      writeJSON(k('saved'), list)
    }
    return list
  },

  async updateSavedScheme(input: { schemeId: string; applicationStatus: 'saved' | 'applied' | 'approved' | 'rejected'; notes?: string }) {
    await sleep(180)
    const list = readJSON<SavedScheme[]>(k('saved'), [])
    const idx = list.findIndex((s) => s.schemeId === input.schemeId)
    if (idx >= 0) {
      list[idx] = { ...list[idx], applicationStatus: input.applicationStatus, notes: input.notes }
    } else {
      list.unshift({ schemeId: input.schemeId, savedAt: now(), applicationStatus: input.applicationStatus, notes: input.notes })
    }
    writeJSON(k('saved'), list)
    return list
  },

  async listSavedSchemes() {
    await sleep(180)
    return readJSON<SavedScheme[]>(k('saved'), [])
  },

  async applyScheme(input: { schemeId: string; schemeName: string; status: SchemeApplication['status']; notes?: string }) {
    await sleep(220)
    const list = readJSON<SchemeApplication[]>(k('applications'), [])
    const idx = list.findIndex((a) => a.schemeId === input.schemeId)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...input, updatedAt: now() }
    } else {
      list.unshift({
        id: uid('app'),
        schemeId: input.schemeId,
        schemeName: input.schemeName,
        status: input.status,
        appliedAt: now(),
        updatedAt: now(),
        notes: input.notes,
      })
    }
    writeJSON(k('applications'), list)
    return list
  },

  async listApplications() {
    await sleep(160)
    return readJSON<SchemeApplication[]>(k('applications'), [])
  },

  async getDashboard() {
    await sleep(260)
    const profile = readJSON<Profile | null>(k('profile'), null)
    const applications = readJSON<SchemeApplication[]>(k('applications'), [])
    const savedSchemes = readJSON<SavedScheme[]>(k('saved'), [])
    const moodEntries = readJSON<MoodEntry[]>(k('mood'), [])
    const disha = readJSON<DishaMessage[]>(k('disha'), [])

    const recommended = SCHEMES.filter((s) => withinEligibility(s, profile)).slice(0, 3)
    const recentConversations = disha.slice(-10)

    return {
      user: profile,
      applications,
      savedSchemes,
      moodEntries,
      recentConversations,
      recommended,
      scholarshipDeadlines: [
        { name: 'NMMS Application Window', date: '2026-09-30' },
        { name: 'Post-Matric Scholarship Renewal', date: '2026-11-15' },
      ],
    }
  },

  async listMoodEntries(days = 30) {
    await sleep(200)
    const since = Date.now() - days * 24 * 60 * 60 * 1000
    return readJSON<MoodEntry[]>(k('mood'), []).filter((e) => new Date(e.timestamp).getTime() >= since)
  },

  async addMoodEntry(input: { mood: number; note?: string }) {
    await sleep(180)
    const list = readJSON<MoodEntry[]>(k('mood'), [])
    const entry: MoodEntry = { id: uid('mood'), mood: input.mood, note: input.note, timestamp: now() }
    list.push(entry)
    writeJSON(k('mood'), list)

    const profile = readJSON<Profile | null>(k('profile'), null)
    if (profile) {
      const next = { ...profile, wellnessStreak: (profile.wellnessStreak || 0) + 1, lastActive: now() }
      writeJSON(k('profile'), next)
    }

    return entry
  },

  async listJournalEntries() {
    await sleep(220)
    return readJSON<JournalEntry[]>(k('journal'), [])
  },

  async createJournalEntry(input: { title: string; body: string }) {
    await sleep(240)
    const list = readJSON<JournalEntry[]>(k('journal'), [])
    const entry: JournalEntry = {
      id: uid('jrnl'),
      title: input.title,
      body: input.body,
      wordCount: wordCount(input.body),
      createdAt: now(),
    }
    list.unshift(entry)
    writeJSON(k('journal'), list)
    return entry
  },

  async deleteJournalEntry(id: string) {
    await sleep(180)
    const list = readJSON<JournalEntry[]>(k('journal'), [])
    writeJSON(
      k('journal'),
      list.filter((e) => e.id !== id),
    )
  },

  async getDishaHistory() {
    await sleep(220)
    const profile = readJSON<Profile | null>(k('profile'), null)
    const messages = readJSON<DishaMessage[]>(k('disha'), [])
    if (messages.length === 0) {
      const intro: DishaMessage = { role: 'assistant', content: dishaIntro({ profile } as any), timestamp: now() }
      const seeded = [intro]
      writeJSON(k('disha'), seeded)
      return seeded
    }
    return messages
  },

  async clearDishaHistory() {
    await sleep(120)
    writeJSON(k('disha'), [])
    await this.getDishaHistory()
  },

  async dishaChat(message: string) {
    await sleep(240)
    const profile = readJSON<Profile | null>(k('profile'), null)
    const messages = readJSON<DishaMessage[]>(k('disha'), [])
    if (messages.length === 0) {
      messages.push({ role: 'assistant', content: dishaIntro({ profile } as any), timestamp: now() })
    }
    messages.push({ role: 'user', content: message, timestamp: now() })
    const reply = dishaReply(message, { profile } as any)
    messages.push({ role: 'assistant', content: reply, timestamp: now() })
    writeJSON(k('disha'), messages)

    if (profile) {
      const next = { ...profile, totalDishaConversations: (profile.totalDishaConversations || 0) + 1, lastActive: now() }
      writeJSON(k('profile'), next)
    }

    return reply
  },

  async listDocuments() {
    await sleep(220)
    return readJSON<DocumentItem[]>(k('docs'), [])
  },

  async explainDocument(input: { filename: string; pastedText?: string }) {
    await sleep(360)
    const t = (input.pastedText || '').toLowerCase()
    const deadlineMatch = (input.pastedText || '').match(/(\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b)/)
    const deadline = deadlineMatch ? deadlineMatch[0] : null
    const isScholarship = t.includes('scholar') || t.includes('fee') || t.includes('admission')
    const isScheme = t.includes('yojana') || t.includes('scheme') || t.includes('benefit')

    const summary =
      `Plain English summary\n` +
      `This looks like ${isScholarship ? 'a scholarship/education notice' : isScheme ? 'a scheme/government notice' : 'an official notice or form'}. ` +
      `In this demo, you can paste any important text and SchemeIndia will highlight what matters.\n\n` +
      `Key points\n` +
      `- Keep your Aadhaar and bank details ready.\n` +
      `- Make a folder for documents: ID, address, income/caste (if needed), and photos.\n\n` +
      `What action is required\n` +
      `1) Read eligibility line-by-line.\n` +
      `2) Write down the 2–3 documents you’re missing.\n` +
      `3) Apply on the official portal or nearest help center (CSC/office).\n\n` +
      `Deadline (if any)\n` +
      `${deadline ? deadline : 'Not found in the pasted text.'}`

    const items = readJSON<DocumentItem[]>(k('docs'), [])
    const item: DocumentItem = { id: uid('doc'), filename: input.filename, summary, createdAt: now() }
    items.unshift(item)
    writeJSON(k('docs'), items)
    return summary
  },
}
