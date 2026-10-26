import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'

export interface FollowDocument {
  follower: mongoose.Types.ObjectId
  following: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type Follow = HydratedDocument<FollowDocument>

const followSchema = new Schema<FollowDocument>(
  {
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    following: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true, versionKey: false },
)

// One account can follow another account exactly once.
followSchema.index({ follower: 1, following: 1 }, { unique: true })

export const FollowModel: Model<FollowDocument> =
  (mongoose.models.Follow as Model<FollowDocument>) ??
  mongoose.model<FollowDocument>('Follow', followSchema)
