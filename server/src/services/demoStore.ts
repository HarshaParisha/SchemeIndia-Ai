import { randomUUID } from 'crypto'
import mongoose from 'mongoose'

import { loadSchemes } from './schemeMatcherService.js'
import { matchSchemes } from './schemeMatcherService.js'

type AnyRecord = Record<string, any>

type DemoUser = {
  _id: string
  clerkId: string
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
  createdAt: Date
  lastActive: Date
  wellnessStreak: number
  totalDishaConversations: number
}

type DemoConversationMessage = { role: 'user' | 'assistant'; content: string; timestamp: Date }
type DemoConversation = { _id: string; userId: string; messages: DemoConversationMessage[]; createdAt: Date; updatedAt: Date }

type DemoMoodEntry = { _id: string; userId: string; mood: number; note?: string; timestamp: Date }
type DemoJournalEntry = { _id: string; userId: string; title: string; body: string; wordCount: number; createdAt: Date }
type DemoSavedScheme = { _id: string; userId: string; schemeId: string; savedAt: Date }
type DemoSchemeApplication = {
  _id: string
  userId: string
  schemeId: string
  schemeName: string
  status: 'Applied' | 'Pending' | 'Approved'
  appliedAt: Date
  updatedAt: Date
  notes?: string
}

const users = new Map<string, DemoUser>()
const conversations = new Map<string, DemoConversation>()
const moodEntries = new Map<string, DemoMoodEntry[]>()
const journalEntries = new Map<string, DemoJournalEntry[]>()
const savedSchemes = new Map<string, DemoSavedScheme[]>()
const schemeApplications = new Map<string, DemoSchemeApplication[]>()

export function isDemoMode() {
  return mongoose.connection.readyState !== 1
}

function now() {
  return new Date()
}

export const demoStore = {
  async getUser(clerkId: string) {
    return users.get(clerkId) || null
  },

  async upsertUser(clerkId: string, updates: AnyRecord) {
    const existing = users.get(clerkId)
    const base: DemoUser =
      existing ||
      ({
        _id: randomUUID(),
        clerkId,
        createdAt: now(),
        lastActive: now(),
        wellnessStreak: 0,
        totalDishaConversations: 0,
      } satisfies DemoUser)

    const next: DemoUser = {
      ...base,
      ...updates,
      clerkId,
      lastActive: now(),
      createdAt: base.createdAt,
    }
    users.set(clerkId, next)
    return next
  },

  async getConversation(clerkId: string) {
    const existing = conversations.get(clerkId)
    if (existing) return existing
    const convo: DemoConversation = {
      _id: randomUUID(),
      userId: clerkId,
      messages: [],
      createdAt: now(),
      updatedAt: now(),
    }
    conversations.set(clerkId, convo)
    return convo
  },

  async appendMessage(clerkId: string, role: 'user' | 'assistant', content: string) {
    const convo = await this.getConversation(clerkId)
    convo.messages.push({ role, content, timestamp: now() })
    convo.updatedAt = now()
    conversations.set(clerkId, convo)
    if (role === 'assistant') {
      const u = users.get(clerkId)
      if (u) {
        users.set(clerkId, { ...u, totalDishaConversations: (u.totalDishaConversations || 0) + 1 })
      }
    }
    return convo
  },

  async clearConversation(clerkId: string) {
    conversations.delete(clerkId)
  },

  async addMoodEntry(clerkId: string, mood: number, note?: string) {
    const entry: DemoMoodEntry = { _id: randomUUID(), userId: clerkId, mood, note, timestamp: now() }
    const list = moodEntries.get(clerkId) || []
    list.push(entry)
    moodEntries.set(clerkId, list)
    const u = users.get(clerkId)
    if (u) users.set(clerkId, { ...u, wellnessStreak: (u.wellnessStreak || 0) + 1 })
    return entry
  },

  async getMoodEntries(clerkId: string, days: number) {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * days)
    return (moodEntries.get(clerkId) || []).filter((e) => e.timestamp >= since).sort((a, b) => +a.timestamp - +b.timestamp)
  },

  async createJournalEntry(clerkId: string, title: string, body: string) {
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length
    const entry: DemoJournalEntry = { _id: randomUUID(), userId: clerkId, title, body, wordCount, createdAt: now() }
    const list = journalEntries.get(clerkId) || []
    list.unshift(entry)
    journalEntries.set(clerkId, list)
    return entry
  },

  async getJournalEntries(clerkId: string) {
    return (journalEntries.get(clerkId) || []).slice().sort((a, b) => +b.createdAt - +a.createdAt)
  },

  async deleteJournalEntry(clerkId: string, id: string) {
    const list = journalEntries.get(clerkId) || []
    journalEntries.set(
      clerkId,
      list.filter((e) => e._id !== id),
    )
  },

  async saveScheme(clerkId: string, schemeId: string) {
    const list = savedSchemes.get(clerkId) || []
    if (list.some((s) => s.schemeId === schemeId)) return
    list.unshift({ _id: randomUUID(), userId: clerkId, schemeId, savedAt: now() })
    savedSchemes.set(clerkId, list)
  },

  async getSavedSchemes(clerkId: string) {
    return (savedSchemes.get(clerkId) || []).slice().sort((a, b) => +b.savedAt - +a.savedAt)
  },

  async applyScheme(
    clerkId: string,
    input: { schemeId: string; schemeName: string; status: 'Applied' | 'Pending' | 'Approved'; notes?: string },
  ) {
    const list = schemeApplications.get(clerkId) || []
    const idx = list.findIndex((a) => a.schemeId === input.schemeId)
    const ts = now()
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...input, updatedAt: ts }
    } else {
      list.unshift({
        _id: randomUUID(),
        userId: clerkId,
        schemeId: input.schemeId,
        schemeName: input.schemeName,
        status: input.status,
        appliedAt: ts,
        updatedAt: ts,
        notes: input.notes,
      })
    }
    schemeApplications.set(clerkId, list)
  },

  async getApplications(clerkId: string) {
    return (schemeApplications.get(clerkId) || []).slice().sort((a, b) => +b.updatedAt - +a.updatedAt)
  },

  async getDashboard(clerkId: string) {
    const user = users.get(clerkId) || null
    const applications = await this.getApplications(clerkId)
    const saved = await this.getSavedSchemes(clerkId)
    const convo = conversations.get(clerkId)
    const moods = await this.getMoodEntries(clerkId, 14)
    const recInput = {
      userType: user?.userType,
      state: user?.state,
      age: user?.age,
      income: user?.income,
      casteCategory: user?.casteCategory,
      gender: user?.gender,
    }
    const recommended = matchSchemes(recInput).slice(0, 3)
    const recentConversations = (convo?.messages || []).slice(-10)

    return {
      user,
      applications,
      savedSchemes: saved,
      moodEntries: moods,
      recentConversations,
      recommended,
      scholarshipDeadlines: [
        { name: 'NMMS Application Window', date: '2026-09-30' },
        { name: 'Post-Matric Scholarship Renewal', date: '2026-11-15' },
      ],
    }
  },

  loadSchemes,
}
