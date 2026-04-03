import mongoose from 'mongoose'

const schemeApplicationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    schemeId: { type: String, required: true, index: true },
    schemeName: { type: String, required: true },
    status: { type: String, required: true },
    appliedAt: { type: Date },
    updatedAt: { type: Date },
    notes: { type: String },
  },
  { versionKey: false },
)

schemeApplicationSchema.index({ userId: 1, schemeId: 1 })

export const SchemeApplicationModel =
  mongoose.models.SchemeApplication || mongoose.model('SchemeApplication', schemeApplicationSchema)

