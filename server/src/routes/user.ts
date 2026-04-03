import { Router } from 'express'
import { z } from 'zod'

import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { ConversationModel } from '../models/Conversation.js'
import { MoodEntryModel } from '../models/MoodEntry.js'
import { SavedSchemeModel } from '../models/SavedScheme.js'
import { SchemeApplicationModel } from '../models/SchemeApplication.js'
import { UserModel, type UserDoc } from '../models/User.js'
import { matchSchemes } from '../services/schemeMatcherService.js'
import { demoStore, isDemoMode } from '../services/demoStore.js'

export const userRouter = Router()

userRouter.get('/profile', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      const user = await demoStore.getUser(clerkId)
      return res.json({ ok: true, data: { user } })
    }
    const user = (await UserModel.findOne({ clerkId }).lean()) as UserDoc | null
    res.json({ ok: true, data: { user } })
  } catch (err) {
    next(err)
  }
})

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  email: z.string().email().optional(),
  userType: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  age: z.number().optional(),
  income: z.number().optional(),
  annualIncome: z.string().optional(),
  casteCategory: z.string().optional(),
  gender: z.string().optional(),
  conditions: z.array(z.string()).optional(),
  needs: z.array(z.string()).optional(),
  onboardingCompleted: z.boolean().optional(),
  needsSelected: z.array(z.string()).optional(),
})

userRouter.put('/profile', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    const input = updateSchema.parse(req.body)
    if (isDemoMode()) {
      const user = await demoStore.upsertUser(clerkId, input)
      return res.json({ ok: true, data: { user } })
    }
    const now = new Date()
    await UserModel.updateOne({ clerkId }, { $set: { ...input, lastActive: now }, $setOnInsert: { createdAt: now } }, { upsert: true })
    const user = (await UserModel.findOne({ clerkId }).lean()) as UserDoc | null
    res.json({ ok: true, data: { user } })
  } catch (err) {
    next(err)
  }
})

const onboardingSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  email: z.string().email().optional(),
  state: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  age: z.number().min(0).max(120).optional(),
  gender: z.string().optional(),
  income: z.number().optional(),
  annualIncome: z.string().optional(),
  casteCategory: z.string().optional(),
  userType: z.string().optional(),
  conditions: z.array(z.string()).optional(),
  needs: z.array(z.string()).optional(),
})

userRouter.post('/onboarding', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    const input = onboardingSchema.parse(req.body)
    const now = new Date()

    if (isDemoMode()) {
      const user = await demoStore.upsertUser(clerkId, { ...input, onboardingCompleted: true })
      return res.json({ ok: true, data: { user } })
    }

    await UserModel.updateOne(
      { clerkId },
      {
        $set: { ...input, onboardingCompleted: true, lastActive: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    )
    const user = (await UserModel.findOne({ clerkId }).lean()) as UserDoc | null
    res.json({ ok: true, data: { user } })
  } catch (err) {
    next(err)
  }
})

userRouter.get('/dashboard', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      const data = await demoStore.getDashboard(clerkId)
      return res.json({ ok: true, data })
    }
    const user = await UserModel.findOne({ clerkId }).lean()
    const applications = await SchemeApplicationModel.find({ userId: clerkId }).sort({ updatedAt: -1 }).lean()
    const savedSchemes = await SavedSchemeModel.find({ userId: clerkId }).sort({ savedAt: -1 }).lean()
    const convo = (await ConversationModel.findOne({ userId: clerkId }).lean()) as { messages?: any[] } | null
    const moodSince = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14)
    const moodEntries = await MoodEntryModel.find({ userId: clerkId, timestamp: { $gte: moodSince } })
      .sort({ timestamp: 1 })
      .lean()

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

    res.json({
      ok: true,
      data: {
        user,
        applications,
        savedSchemes,
        moodEntries,
        recentConversations,
        recommended,
        scholarshipDeadlines: [
          { name: 'NMMS Application Window', date: '2026-09-30' },
          { name: 'Post-Matric Scholarship Renewal', date: '2026-11-15' },
        ],
      },
    })
  } catch (err) {
    next(err)
  }
})
