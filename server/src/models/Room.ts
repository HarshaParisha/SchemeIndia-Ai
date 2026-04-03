import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
)

export const RoomModel = mongoose.models.Room || mongoose.model('Room', roomSchema)

