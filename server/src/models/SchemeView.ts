import mongoose from 'mongoose'

export type SchemeViewDoc = {
  schemeId: string
  viewedAt: Date
  source: string
}

const schemeViewSchema = new mongoose.Schema<SchemeViewDoc>(
  {
    schemeId: { type: String, required: true, index: true },
    viewedAt: { type: Date, default: () => new Date(), index: true },
    source: { type: String, default: '' },
  },
  { versionKey: false },
)

schemeViewSchema.index({ schemeId: 1, viewedAt: -1 })

export const SchemeViewModel =
  (mongoose.models.SchemeView as mongoose.Model<SchemeViewDoc>) || mongoose.model<SchemeViewDoc>('SchemeView', schemeViewSchema)

