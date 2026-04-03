import type { RequestHandler } from 'express'
import { z } from 'zod'

import type { AuthedRequest } from '../middleware/auth.js'
import { SavedSchemeModel } from '../models/SavedScheme.js'
import { SchemeModel } from '../models/Scheme.js'
import { demoStore, isDemoMode } from '../services/demoStore.js'

export const getSavedHandler: RequestHandler = async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      const saved = await demoStore.getSavedSchemes(clerkId)
      return res.json({ ok: true, data: { saved } })
    }
    const saved = await SavedSchemeModel.find({ userId: clerkId }).sort({ savedAt: -1 }).lean()
    res.json({ ok: true, data: { saved } })
  } catch (err) {
    next(err)
  }
}

export const saveSchemeHandler: RequestHandler = async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    const schemeId = String(req.params.schemeId || '').trim()
    if (!schemeId) return res.status(400).json({ ok: false, error: { message: 'schemeId is required.' } })

    if (isDemoMode()) {
      await demoStore.saveScheme(clerkId, schemeId)
      return res.json({ ok: true })
    }

    const now = new Date()
    await SavedSchemeModel.updateOne(
      { userId: clerkId, schemeId },
      { $setOnInsert: { savedAt: now }, $set: { applicationStatus: 'saved' } },
      { upsert: true },
    )
    await SchemeModel.updateOne({ $or: [{ id: schemeId }, { slug: schemeId }] }, { $inc: { savedCount: 1 } })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export const deleteSavedHandler: RequestHandler = async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    const schemeId = String(req.params.schemeId || '').trim()
    if (!schemeId) return res.status(400).json({ ok: false, error: { message: 'schemeId is required.' } })

    if (isDemoMode()) {
      return res.status(501).json({ ok: false, error: { message: 'Not supported in demo mode.' } })
    }

    await SavedSchemeModel.deleteOne({ userId: clerkId, schemeId })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

const updateStatusSchema = z.object({
  applicationStatus: z.enum(['saved', 'applied', 'approved', 'rejected']),
  notes: z.string().max(2000).optional(),
})

export const updateSavedStatusHandler: RequestHandler = async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    const schemeId = String(req.params.schemeId || '').trim()
    const input = updateStatusSchema.parse(req.body)

    if (isDemoMode()) {
      return res.status(501).json({ ok: false, error: { message: 'Not supported in demo mode.' } })
    }

    await SavedSchemeModel.updateOne(
      { userId: clerkId, schemeId },
      { $set: { applicationStatus: input.applicationStatus, ...(input.notes ? { notes: input.notes } : {}) } },
      { upsert: true },
    )
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
