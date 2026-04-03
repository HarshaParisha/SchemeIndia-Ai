import mongoose from 'mongoose'

export type SchemeDoc = {
  id: string
  name: string
  slug: string
  governmentLevel: 'central' | 'state'
  state: string | null
  ministry: string
  department: string
  category: string
  subcategory: string
  launchYear: number
  lastUpdated: Date
  status: 'active' | 'upcoming' | 'expired'
  shortDescription: string
  fullDescription: string
  benefits: Array<{
    type: string
    description: string
    amount: string
    frequency: string
  }>
  eligibility: {
    minAge: number | null
    maxAge: number | null
    gender: 'all' | 'male' | 'female'
    casteCategories: string[]
    maxAnnualIncome: number | null
    employmentStatus: string[]
    requiredConditions: string[]
    excludedConditions: string[]
  }
  documents: Array<{
    name: string
    mandatory: boolean
    description: string
  }>
  applicationProcess: {
    mode: 'online' | 'offline' | 'both'
    steps: string[]
    onlinePortalUrl: string
    offlineFormUrl: string
    helplineNumber: string
  }
  tags: string[]
  searchKeywords: string[]
  beneficiaryCount: number
  viewCount: number
  savedCount: number
  isVerified: boolean
  createdAt: Date
}

const schemeSchema = new mongoose.Schema<SchemeDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    governmentLevel: { type: String, required: true, enum: ['central', 'state'], index: true },
    state: { type: String, default: null, index: true },
    ministry: { type: String, required: true, index: true },
    department: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: '' },
    launchYear: { type: Number, default: () => new Date().getFullYear() },
    lastUpdated: { type: Date, default: () => new Date(), index: true },
    status: { type: String, required: true, enum: ['active', 'upcoming', 'expired'], index: true },
    shortDescription: { type: String, default: '' },
    fullDescription: { type: String, default: '' },
    benefits: {
      type: [
        {
          type: { type: String, default: '' },
          description: { type: String, default: '' },
          amount: { type: String, default: '' },
          frequency: { type: String, default: '' },
        },
      ],
      default: [],
    },
    eligibility: {
      type: {
        minAge: { type: Number, default: null },
        maxAge: { type: Number, default: null },
        gender: { type: String, enum: ['all', 'male', 'female'], default: 'all' },
        casteCategories: { type: [String], default: [] },
        maxAnnualIncome: { type: Number, default: null },
        employmentStatus: { type: [String], default: [] },
        requiredConditions: { type: [String], default: [] },
        excludedConditions: { type: [String], default: [] },
      },
      default: () => ({
        minAge: null,
        maxAge: null,
        gender: 'all',
        casteCategories: [],
        maxAnnualIncome: null,
        employmentStatus: [],
        requiredConditions: [],
        excludedConditions: [],
      }),
    },
    documents: {
      type: [
        {
          name: { type: String, default: '' },
          mandatory: { type: Boolean, default: true },
          description: { type: String, default: '' },
        },
      ],
      default: [],
    },
    applicationProcess: {
      type: {
        mode: { type: String, enum: ['online', 'offline', 'both'], default: 'online' },
        steps: { type: [String], default: [] },
        onlinePortalUrl: { type: String, default: '' },
        offlineFormUrl: { type: String, default: '' },
        helplineNumber: { type: String, default: '' },
      },
      default: () => ({ mode: 'online', steps: [], onlinePortalUrl: '', offlineFormUrl: '', helplineNumber: '' }),
    },
    tags: { type: [String], default: [], index: true },
    searchKeywords: { type: [String], default: [], index: true },
    beneficiaryCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0, index: true },
    savedCount: { type: Number, default: 0, index: true },
    isVerified: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: () => new Date(), index: true },
  },
  { versionKey: false },
)

schemeSchema.index({ governmentLevel: 1, state: 1, category: 1, status: 1 })
schemeSchema.index({ name: 'text', shortDescription: 'text', fullDescription: 'text', tags: 'text', searchKeywords: 'text' })

export const SchemeModel =
  (mongoose.models.Scheme as mongoose.Model<SchemeDoc>) || mongoose.model<SchemeDoc>('Scheme', schemeSchema)

