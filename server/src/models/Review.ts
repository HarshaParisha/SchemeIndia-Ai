import mongoose from 'mongoose'

export type ReviewDoc = {
  schemeId: string
  userId: string
  rating: number
  helpful: boolean
  comment: string
  createdAt: Date
}

const reviewSchema = new mongoose.Schema<ReviewDoc>(
  {
    schemeId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    helpful: { type: Boolean, default: true },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: () => new Date(), index: true },
  },
  { versionKey: false },
)

reviewSchema.index({ schemeId: 1, userId: 1 }, { unique: true })

export const ReviewModel =
  (mongoose.models.Review as mongoose.Model<ReviewDoc>) || mongoose.model<ReviewDoc>('Review', reviewSchema)

