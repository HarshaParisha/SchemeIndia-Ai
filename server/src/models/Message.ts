import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    alias: { type: String, required: true },
    content: { type: String, required: true },
    reactions: { type: Object, default: {} },
    timestamp: { type: Date, default: () => new Date() },
    reported: { type: Boolean, default: false },
  },
  { versionKey: false },
)

messageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 })

export const MessageModel = mongoose.models.Message || mongoose.model('Message', messageSchema)
