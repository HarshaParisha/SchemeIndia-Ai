import type { RequestHandler } from 'express'
import { z } from 'zod'

import { getSchemeByIdOrSlug, listSchemes, matchSchemes } from '../services/schemeService.js'

const listSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  state: z.string().optional(),
  governmentLevel: z.enum(['central', 'state']).optional(),
  ministry: z.string().optional(),
  status: z.enum(['active', 'upcoming', 'expired']).optional(),
  sort: z.enum(['relevant', 'newest', 'highestBenefit']).optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
})

export const listSchemesHandler: RequestHandler = async (req, res, next) => {
  try {
    const q = listSchema.parse(req.query)
    const page = Math.max(1, q.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, q.pageSize ?? 12))

    const { items, total } = await listSchemes({
      q: q.q,
      category: q.category,
      state: q.state,
      governmentLevel: q.governmentLevel,
      ministry: q.ministry,
      status: q.status,
      sort: q.sort ?? 'relevant',
      page,
      pageSize,
    })
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.json({ ok: true, data: { items, total, page, pageSize } })
  } catch (err) {
    next(err)
  }
}

export const listCentralSchemesHandler: RequestHandler = async (req, res, next) => {
  try {
    const q = listSchema.parse(req.query)
    const page = Math.max(1, q.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, q.pageSize ?? 12))
    const { items, total } = await listSchemes({
      q: q.q,
      category: q.category,
      state: undefined,
      governmentLevel: 'central',
      ministry: q.ministry,
      status: q.status,
      sort: q.sort ?? 'relevant',
      page,
      pageSize,
    })
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.json({ ok: true, data: { items, total, page, pageSize } })
  } catch (err) {
    next(err)
  }
}

export const listSchemesByCategoryHandler: RequestHandler = async (req, res, next) => {
  try {
    const category = String(req.params.category || '').trim()
    const q = listSchema.parse(req.query)
    const page = Math.max(1, q.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, q.pageSize ?? 12))
    const { items, total } = await listSchemes({
      q: q.q,
      category,
      state: q.state,
      governmentLevel: q.governmentLevel,
      ministry: q.ministry,
      status: q.status,
      sort: q.sort ?? 'relevant',
      page,
      pageSize,
    })
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.json({ ok: true, data: { items, total, page, pageSize } })
  } catch (err) {
    next(err)
  }
}

export const listSchemesByStateHandler: RequestHandler = async (req, res, next) => {
  try {
    const state = String(req.params.state || '').trim()
    const q = listSchema.parse(req.query)
    const page = Math.max(1, q.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, q.pageSize ?? 12))
    const { items, total } = await listSchemes({
      q: q.q,
      category: q.category,
      state,
      governmentLevel: q.governmentLevel,
      ministry: q.ministry,
      status: q.status,
      sort: q.sort ?? 'relevant',
      page,
      pageSize,
    })
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.json({ ok: true, data: { items, total, page, pageSize } })
  } catch (err) {
    next(err)
  }
}

export const getSchemeHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id || '').trim()
    const scheme = await getSchemeByIdOrSlug(id)
    if (!scheme) return res.status(404).json({ ok: false, error: { message: 'Scheme not found.' } })
    res.json({ ok: true, data: { scheme } })
  } catch (err) {
    next(err)
  }
}

const matchSchema = z.object({
  state: z.string().optional(),
  age: z.number().optional(),
  gender: z.enum(['male', 'female', 'all']).optional(),
  casteCategory: z.string().optional(),
  annualIncome: z.number().optional(),
  userType: z.string().optional(),
  conditions: z.array(z.string()).optional(),
  needs: z.array(z.string()).optional(),
})

export const matchSchemesHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = matchSchema.parse(req.body)
    const { centralMatches, stateMatches } = await matchSchemes(input)
    res.json({ ok: true, data: { centralMatches, stateMatches } })
  } catch (err) {
    next(err)
  }
}
