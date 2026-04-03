import mongoose from 'mongoose'

const journalEntrySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    wordCount: { type: Number, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
)

export const JournalEntryModel =
  mongoose.models.JournalEntry || mongoose.model('JournalEntry', journalEntrySchema)

