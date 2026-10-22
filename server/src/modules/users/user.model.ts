import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'

export type UserRole = 'student' | 'lecturer' | 'admin'

export interface UserDocument {
  email: string
  username: string
  usernameNormalized: string
  passwordHash: string
  role: UserRole
  emailVerified: boolean
  emailVerificationTokenHash?: string
  emailVerificationExpires?: Date
  passwordResetTokenHash?: string
  passwordResetExpires?: Date
  region: string
  language: string
  timezone: string
  privacyPublic: boolean
  emailNotifications: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type User = HydratedDocument<UserDocument>

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
    },
    usernameNormalized: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['student', 'lecturer', 'admin'] as const,
      default: 'student',
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    region: { type: String, default: 'Nigeria' },
    language: { type: String, default: 'English' },
    timezone: { type: String, default: 'Africa/Lagos (WAT)' },
    privacyPublic: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

userSchema.index({ createdAt: -1 })

/** Public projection of a user — never leaks the password hash or tokens. */
export interface PublicUser {
  id: string
  email: string
  username: string
  role: UserRole
  emailVerified: boolean
  region: string
  language: string
  timezone: string
  privacyPublic: boolean
  emailNotifications: boolean
  createdAt: Date
  lastLoginAt?: Date
}

export function toPublicUser(user: UserDocument & { _id: mongoose.Types.ObjectId }): PublicUser {
  return {
    id: String(user._id),
    email: user.email,
    username: user.username,
    role: user.role,
    emailVerified: user.emailVerified,
    region: user.region,
    language: user.language,
    timezone: user.timezone,
    privacyPublic: user.privacyPublic,
    emailNotifications: user.emailNotifications,
    createdAt: user.createdAt,
    ...(user.lastLoginAt ? { lastLoginAt: user.lastLoginAt } : {}),
  }
}

export const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ??
  mongoose.model<UserDocument>('User', userSchema)
