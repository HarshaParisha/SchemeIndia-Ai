import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import { z } from 'zod'

import { SchemeModel } from '../models/Scheme.js'

const seedSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  governmentLevel: z.enum(['central', 'state']),
  state: z.string().nullable(),
  ministry: z.string().min(1),
  category: z.string().min(1),
  department: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  searchKeywords: z.array(z.string()).optional(),
})

type Seed = z.infer<typeof seedSchema>

function readSeed(fileName: string): Seed[] {
  const filePath = path.join(process.cwd(), 'src', 'data', fileName)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(raw) as unknown
  return z.array(seedSchema).parse(parsed)
}

function normalizeSeed(s: Seed) {
  const now = new Date()
  return {
    id: s.id,
    name: s.name,
    slug: s.id,
    governmentLevel: s.governmentLevel,
    state: s.governmentLevel === 'central' ? null : s.state,
    ministry: s.ministry,
    department: s.department || '',
    category: s.category,
    subcategory: s.subcategory || '',
    launchYear: now.getFullYear(),
    lastUpdated: now,
    status: 'active' as const,
    shortDescription: 'Official government scheme. Check eligibility and apply using the official link.',
    fullDescription: 'Official government scheme. For the latest eligibility rules, required documents, and application windows, refer to the official portal.',
    benefits: [{ type: 'benefit', description: 'Benefit details vary by applicant profile.', amount: '', frequency: '' }],
    eligibility: {
      minAge: null,
      maxAge: null,
      gender: 'all' as const,
      casteCategories: [],
      maxAnnualIncome: null,
      employmentStatus: [],
      requiredConditions: [],
      excludedConditions: [],
    },
    documents: [
      { name: 'Aadhaar', mandatory: true, description: 'Identity verification (as applicable).' },
      { name: 'Bank account details', mandatory: true, description: 'For benefit transfer (as applicable).' },
    ],
    applicationProcess: {
      mode: 'online' as const,
      steps: ['Check eligibility', 'Apply on official portal/CSC', 'Upload documents', 'Track status'],
      onlinePortalUrl: 'https://www.india.gov.in/',
      offlineFormUrl: '',
      helplineNumber: '',
    },
    tags: s.tags || [],
    searchKeywords: s.searchKeywords || [],
    beneficiaryCount: 0,
    viewCount: 0,
    savedCount: 0,
    isVerified: false,
    createdAt: now,
  }
}

export async function seedSchemeIndiaData() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB is not connected. Set MONGODB_URI to seed SchemeIndia data.')
  }

  const central = readSeed('central-schemes.json')
  const state = readSeed('state-schemes.json')
  const all = [...central, ...state]

  const centralCount = central.length
  const stateCount = state.length
  if (centralCount < 80 || stateCount < 120) {
    throw new Error(`Seed files are too small. Expected >=80 central and >=120 state. Got central=${centralCount}, state=${stateCount}.`)
  }

  const ops = all.map((s) => {
    const doc = normalizeSeed(s)
    return {
      updateOne: {
        filter: { id: doc.id },
        update: { $set: doc },
        upsert: true,
      },
    }
  })
  await SchemeModel.bulkWrite(ops, { ordered: false })
}

