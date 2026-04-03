import mongoose from 'mongoose'

const savedSchemeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    schemeId: { type: String, required: true, index: true },
    savedAt: { type: Date, default: () => new Date() },
    applicationStatus: {
      type: String,
      enum: ['saved', 'applied', 'approved', 'rejected'],
      default: 'saved',
      index: true,
    },
    notes: { type: String, default: '' },
  },
  { versionKey: false },
)

savedSchemeSchema.index({ userId: 1, schemeId: 1 }, { unique: true })

export const SavedSchemeModel =
  mongoose.models.SavedScheme || mongoose.model('SavedScheme', savedSchemeSchema)
