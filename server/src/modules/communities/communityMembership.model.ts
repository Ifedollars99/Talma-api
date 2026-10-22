import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export interface CommunityMembershipDocument {
  user: mongoose.Types.ObjectId
  community: mongoose.Types.ObjectId
  joinedAt: Date
  createdAt: Date
  updatedAt: Date
}

export type CommunityMembership = HydratedDocument<CommunityMembershipDocument>

const membershipSchema = new Schema<CommunityMembershipDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    community: { type: Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    joinedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true, versionKey: false },
)

membershipSchema.index({ user: 1, community: 1 }, { unique: true })

export const CommunityMembershipModel: Model<CommunityMembershipDocument> =
  (mongoose.models.CommunityMembership as Model<CommunityMembershipDocument>) ??
  mongoose.model<CommunityMembershipDocument>('CommunityMembership', membershipSchema)
