import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export interface ReactionDocument {
  post: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type Reaction = HydratedDocument<ReactionDocument>

const reactionSchema = new Schema<ReactionDocument>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true, versionKey: false },
)

// A user can only like a post once.
reactionSchema.index({ post: 1, user: 1 }, { unique: true })

export const ReactionModel: Model<ReactionDocument> =
  (mongoose.models.Reaction as Model<ReactionDocument>) ??
  mongoose.model<ReactionDocument>('Reaction', reactionSchema)
