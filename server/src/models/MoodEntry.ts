import mongoose from 'mongoose'

const moodEntrySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    mood: { type: Number, required: true },
    note: { type: String },
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { versionKey: false },
)

moodEntrySchema.index({ userId: 1, timestamp: -1 })

export const MoodEntryModel = mongoose.models.MoodEntry || mongoose.model('MoodEntry', moodEntrySchema)

