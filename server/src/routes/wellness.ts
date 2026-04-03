import { Router } from 'express'
import { z } from 'zod'

import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { JournalEntryModel } from '../models/JournalEntry.js'
import { MoodEntryModel } from '../models/MoodEntry.js'
import { demoStore, isDemoMode } from '../services/demoStore.js'

export const wellnessRouter = Router()

const moodSchema = z.object({
  mood: z.number().min(1).max(5),
  note: z.string().max(200).optional(),
})

wellnessRouter.post('/mood', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { mood, note } = moodSchema.parse(req.body)
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      const entry = await demoStore.addMoodEntry(clerkId, mood, note)
      return res.json({ ok: true, data: { entry } })
    }
    const entry = await MoodEntryModel.create({ userId: clerkId, mood, note, timestamp: new Date() })
    res.json({ ok: true, data: { entry } })
  } catch (err) {
    next(err)
  }
})

wellnessRouter.get('/mood', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      const entries = await demoStore.getMoodEntries(clerkId, 30)
      return res.json({ ok: true, data: { entries } })
    }
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
    const entries = await MoodEntryModel.find({ userId: clerkId, timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .lean()
    res.json({ ok: true, data: { entries } })
  } catch (err) {
    next(err)
  }
})

const journalSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(6000),
})

wellnessRouter.post('/journal', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { title, body } = journalSchema.parse(req.body)
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      const entry = await demoStore.createJournalEntry(clerkId, title, body)
      return res.json({ ok: true, data: { entry } })
    }
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length
    const entry = await JournalEntryModel.create({ userId: clerkId, title, body, wordCount, createdAt: new Date() })
    res.json({ ok: true, data: { entry } })
  } catch (err) {
    next(err)
  }
})

wellnessRouter.get('/journal', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      const entries = await demoStore.getJournalEntries(clerkId)
      return res.json({ ok: true, data: { entries } })
    }
    const entries = await JournalEntryModel.find({ userId: clerkId }).sort({ createdAt: -1 }).lean()
    res.json({ ok: true, data: { entries } })
  } catch (err) {
    next(err)
  }
})

wellnessRouter.delete('/journal/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      await demoStore.deleteJournalEntry(clerkId, req.params.id)
      return res.json({ ok: true })
    }
    await JournalEntryModel.deleteOne({ _id: req.params.id, userId: clerkId })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})
