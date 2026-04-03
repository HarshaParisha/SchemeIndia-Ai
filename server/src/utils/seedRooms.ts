import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'

import { RoomModel } from '../models/Room.js'

export async function seedRoomsIfEmpty() {
  if (mongoose.connection.readyState !== 1) return
  const count = await RoomModel.countDocuments({})
  if (count > 0) return

  const filePath = path.join(process.cwd(), 'src', 'data', 'rooms.seed.json')
  if (!fs.existsSync(filePath)) return
  const raw = fs.readFileSync(filePath, 'utf-8')
  const rooms = JSON.parse(raw) as Array<{ name: string; category: string; description?: string }>
  if (!Array.isArray(rooms) || rooms.length === 0) return
  await RoomModel.insertMany(rooms)
}
