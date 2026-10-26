import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'

export type CreatorApplicationStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

/**
 * Payout and approval details for a Talma creator.
 *
 * `User.creatorStatus` mirrors `status` so authorization checks can read the
 * flag from the user document; this model holds the bank/payout information.
 */
export interface CreatorProfileDocument {
  user: mongoose.Types.ObjectId
  displayName: string
  bio: string
  status: CreatorApplicationStatus
  /** Paystack bank code and resolved account details. */
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
  /** The creator's percentage of each sale. The platform keeps the rest. */
  sharePercent: number
  /** Paystack subaccount used to split each checkout automatically. */
  paystackSubaccountCode?: string
  appliedAt: Date
  reviewedAt?: Date
  reviewedBy?: mongoose.Types.ObjectId
  rejectionReason?: string
  createdAt: Date
  updatedAt: Date
}

export type CreatorProfile = HydratedDocument<CreatorProfileDocument>

const creatorProfileSchema = new Schema<CreatorProfileDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    bio: { type: String, default: '', trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'] as const,
      default: 'pending',
      index: true,
    },
    bankCode: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    sharePercent: { type: Number, required: true, min: 0, max: 100 },
    paystackSubaccountCode: { type: String, trim: true },
    appliedAt: { type: Date, default: () => new Date() },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
)

creatorProfileSchema.index({ status: 1, createdAt: -1 })

export const CreatorProfileModel: Model<CreatorProfileDocument> =
  (mongoose.models.CreatorProfile as Model<CreatorProfileDocument>) ??
  mongoose.model<CreatorProfileDocument>('CreatorProfile', creatorProfileSchema)
