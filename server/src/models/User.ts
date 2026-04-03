import mongoose from 'mongoose'

export type UserDoc = {
  clerkId: string
  name?: string
  email?: string
  userType?: string
  state?: string
  district?: string
  age?: number
  income?: number
  annualIncome?: string
  casteCategory?: string
  gender?: string
  conditions?: string[]
  needs?: string[]
  onboardingCompleted?: boolean
  needsSelected: string[]
  createdAt: Date
  lastActive?: Date
  wellnessStreak: number
  totalDishaConversations: number
}

export type UserType = 'Student' | 'Farmer' | 'Working Professional' | 'Other'

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    email: { type: String },
    userType: { type: String },
    state: { type: String },
    district: { type: String },
    age: { type: Number },
    income: { type: Number },
    annualIncome: { type: String },
    casteCategory: { type: String },
    gender: { type: String },
    conditions: { type: [String], default: [] },
    needs: { type: [String], default: [] },
    onboardingCompleted: { type: Boolean, default: false, index: true },
    needsSelected: { type: [String], default: [] },
    createdAt: { type: Date, default: () => new Date() },
    lastActive: { type: Date },
    wellnessStreak: { type: Number, default: 0 },
    totalDishaConversations: { type: Number, default: 0 },
  },
  { versionKey: false },
)

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDoc>) || mongoose.model<UserDoc>('User', userSchema)
