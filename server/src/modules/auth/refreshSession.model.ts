import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export interface RefreshSessionDocument {
  user: mongoose.Types.ObjectId
  /** SHA-256 hash of the refresh token — the raw token is never stored. */
  tokenHash: string
  /** Session family — rotating a token keeps the same family so reuse can be detected. */
  familyId: string
  userAgent?: string
  ip?: string
  expiresAt: Date
  revokedAt?: Date
  /** Set when this session was rotated; the replacement token lives in the same family. */
  replacedBy?: string
  createdAt: Date
  updatedAt: Date
}

export type RefreshSession = HydratedDocument<RefreshSessionDocument>

const refreshSessionSchema = new Schema<RefreshSessionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    familyId: { type: String, required: true, index: true },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedBy: { type: String },
  },
  { timestamps: true, versionKey: false },
)

// MongoDB's TTL monitor removes expired sessions automatically.
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshSessionModel: Model<RefreshSessionDocument> =
  (mongoose.models.RefreshSession as Model<RefreshSessionDocument>) ??
  mongoose.model<RefreshSessionDocument>('RefreshSession', refreshSessionSchema)
