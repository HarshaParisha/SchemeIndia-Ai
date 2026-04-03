import type { RequestHandler } from 'express'
import mongoose from 'mongoose'

import { SchemeModel } from '../models/Scheme.js'
import { UserModel } from '../models/User.js'
import { loadSchemes as loadLegacySchemes } from '../services/schemeMatcherService.js'

export const statsHandler: RequestHandler = async (_req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const schemes = loadLegacySchemes()
      const central = schemes.filter((s) => s.state === null).length
      const state = schemes.length - central
      const categories = Array.from(new Set(schemes.map((s) => s.category))).length
      return res.json({
        ok: true,
        data: {
          schemes: { total: schemes.length, central, state },
          categories: { total: categories },
          states: { total: 36 },
          users: { total: 0 },
        },
      })
    }

    const [total, central, state, categories, users] = await Promise.all([
      SchemeModel.countDocuments({}),
      SchemeModel.countDocuments({ governmentLevel: 'central' }),
      SchemeModel.countDocuments({ governmentLevel: 'state' }),
      SchemeModel.distinct('category').then((v) => v.length),
      UserModel.countDocuments({}),
    ])
    res.json({
      ok: true,
      data: {
        schemes: { total, central, state },
        categories: { total: categories },
        states: { total: 36 },
        users: { total: users },
      },
    })
  } catch (err) {
    next(err)
  }
}

