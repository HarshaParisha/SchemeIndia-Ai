import type { RequestHandler } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'

import { ReviewModel } from '../models/Review.js'
import { SchemeModel } from '../models/Scheme.js'
import { SchemeViewModel } from '../models/SchemeView.js'

const viewSchema = z.object({
  source: z.string().max(80).optional(),
})

export const trackViewHandler: RequestHandler = async (req, res, next) => {
  try {
    const schemeId = String(req.params.id || '').trim()
    if (!schemeId) return res.status(400).json({ ok: false, error: { message: 'Scheme id is required.' } })

    const { source } = viewSchema.parse(req.body || {})

    if (mongoose.connection.readyState !== 1) {
      return res.json({ ok: true })
    }

    await Promise.all([
      SchemeViewModel.create({ schemeId, source: source || '' }),
      SchemeModel.updateOne({ $or: [{ id: schemeId }, { slug: schemeId }] }, { $inc: { viewCount: 1 } }),
    ])
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  helpful: z.boolean().optional(),
  comment: z.string().max(2000).optional(),
  userId: z.string().min(1),
})

export const addReviewHandler: RequestHandler = async (req, res, next) => {
  try {
    const schemeId = String(req.params.id || '').trim()
    if (!schemeId) return res.status(400).json({ ok: false, error: { message: 'Scheme id is required.' } })

    const input = reviewSchema.parse(req.body)
    if (mongoose.connection.readyState !== 1) {
      return res.json({ ok: true })
    }

    await ReviewModel.updateOne(
      { schemeId, userId: input.userId },
      {
        $set: {
          rating: input.rating,
          helpful: input.helpful ?? true,
          comment: input.comment ?? '',
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

