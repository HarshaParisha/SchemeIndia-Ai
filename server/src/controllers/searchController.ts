import type { RequestHandler } from 'express'
import { z } from 'zod'

import { suggestSearch } from '../services/schemeService.js'

const querySchema = z.object({
  q: z.string().min(1),
})

export const searchHandler: RequestHandler = async (req, res, next) => {
  try {
    const { q } = querySchema.parse(req.query)
    const data = await suggestSearch(q)
    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}

