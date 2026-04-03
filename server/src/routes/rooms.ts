import { Router } from 'express'

import { RoomModel } from '../models/Room.js'

export const roomsRouter = Router()

roomsRouter.get('/', async (_req, res, next) => {
  try {
    const rooms = await RoomModel.find({}).sort({ createdAt: 1 }).lean()
    res.json({ ok: true, data: { rooms } })
  } catch (err) {
    next(err)
  }
})

