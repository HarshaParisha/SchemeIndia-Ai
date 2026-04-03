import { Router } from 'express'
import { z } from 'zod'

import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { SavedSchemeModel } from '../models/SavedScheme.js'
import { SchemeApplicationModel } from '../models/SchemeApplication.js'
import { demoStore, isDemoMode } from '../services/demoStore.js'
import {
  getSchemeHandler,
  listCentralSchemesHandler,
  listSchemesByCategoryHandler,
  listSchemesByStateHandler,
  listSchemesHandler,
  matchSchemesHandler,
} from '../controllers/schemesController.js'
import { addReviewHandler, trackViewHandler } from '../controllers/trackingController.js'

export const schemesRouter = Router()

schemesRouter.get('/', listSchemesHandler)

schemesRouter.get('/central', listCentralSchemesHandler)
schemesRouter.get('/category/:category', listSchemesByCategoryHandler)
schemesRouter.get('/state/:state', listSchemesByStateHandler)

schemesRouter.post('/match', matchSchemesHandler)

schemesRouter.post('/:id/view', trackViewHandler)
schemesRouter.post('/:id/review', addReviewHandler)

const saveSchema = z.object({ schemeId: z.string().min(1) })

schemesRouter.post('/save', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { schemeId } = saveSchema.parse(req.body)
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      await demoStore.saveScheme(clerkId, schemeId)
      return res.json({ ok: true })
    }
    await SavedSchemeModel.updateOne({ userId: clerkId, schemeId }, { $setOnInsert: { savedAt: new Date() } }, { upsert: true })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

schemesRouter.get('/saved', requireAuth, async (req: AuthedRequest, res, next) => {
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
})

const applySchema = z.object({
  schemeId: z.string().min(1),
  schemeName: z.string().min(1),
  status: z.enum(['Applied', 'Pending', 'Approved']),
  notes: z.string().optional(),
})

schemesRouter.post('/apply', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const input = applySchema.parse(req.body)
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      await demoStore.applyScheme(clerkId, input)
      return res.json({ ok: true })
    }
    const now = new Date()
    await SchemeApplicationModel.updateOne(
      { userId: clerkId, schemeId: input.schemeId },
      {
        $set: {
          schemeName: input.schemeName,
          status: input.status,
          updatedAt: now,
          notes: input.notes,
        },
        $setOnInsert: { appliedAt: now },
      },
      { upsert: true },
    )
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

schemesRouter.get('/:id', getSchemeHandler)
