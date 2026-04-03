import mongoose from 'mongoose'

export type ConversationDoc = {
  userId: string
  messages: Array<{ role: string; content: string; timestamp: Date }>
}

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
  },
  { _id: false },
)

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
)

export const ConversationModel =
  (mongoose.models.Conversation as mongoose.Model<ConversationDoc>) ||
  mongoose.model<ConversationDoc>('Conversation', conversationSchema)
