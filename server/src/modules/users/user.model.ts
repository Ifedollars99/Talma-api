import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'

export type UserRole = 'user' | 'creator' | 'student' | 'lecturer' | 'admin'
export type CreatorStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'suspended'
export type Gender = 'male' | 'female'

export interface UserDocument {
  email: string
  username: string
  usernameNormalized: string
  passwordHash: string
  role: UserRole
  /** Whether this account may upload paid videos to Talma's YouTube channel. */
  creatorStatus: CreatorStatus
  /** One-time code sent by email to confirm a creator account. */
  creatorVerificationCodeHash?: string
  creatorVerificationExpires?: Date
  creatorVerifiedAt?: Date
  emailVerified: boolean
  emailVerificationTokenHash?: string
  emailVerificationExpires?: Date
  passwordResetTokenHash?: string
  passwordResetExpires?: Date
  region: string
  state: string
  language: string
  timezone: string
  bio: string
  avatarUrl: string
  gender?: Gender
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
      enum: ['user', 'creator', 'student', 'lecturer', 'admin'] as const,
      default: 'user',
      index: true,
    },
    creatorStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected', 'suspended'] as const,
      default: 'none',
      index: true,
    },
    creatorVerificationCodeHash: { type: String, select: false },
    creatorVerificationExpires: { type: Date, select: false },
    creatorVerifiedAt: { type: Date },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    region: { type: String, default: 'Nigeria', trim: true, maxlength: 80 },
    state: { type: String, default: '', trim: true, maxlength: 80 },
    language: { type: String, default: 'English' },
    timezone: { type: String, default: 'Africa/Lagos (WAT)' },
    bio: { type: String, default: '', trim: true, maxlength: 500 },
    avatarUrl: { type: String, default: '', trim: true, maxlength: 500 },
    gender: { type: String, enum: ['male', 'female'] as const },
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
  creatorStatus: CreatorStatus
  emailVerified: boolean
  region: string
  state: string
  language: string
  timezone: string
  bio: string
  avatarUrl: string
  gender?: Gender
  creatorVerifiedAt?: Date
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
    creatorStatus: user.creatorStatus ?? 'none',
    emailVerified: user.emailVerified,
    region: user.region,
    state: user.state ?? '',
    language: user.language,
    timezone: user.timezone,
    bio: user.bio ?? '',
    avatarUrl: user.avatarUrl ?? '',
    ...(user.gender ? { gender: user.gender } : {}),
    ...(user.creatorVerifiedAt ? { creatorVerifiedAt: user.creatorVerifiedAt } : {}),
    privacyPublic: user.privacyPublic,
    emailNotifications: user.emailNotifications,
    createdAt: user.createdAt,
    ...(user.lastLoginAt ? { lastLoginAt: user.lastLoginAt } : {}),
  }
}

/**
 * A profile that anyone can see on the public creator page. It deliberately
 * leaves out the email address and the account's private preferences.
 */
export interface ProfileSocial {
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

export interface PublicProfile extends ProfileSocial {
  id: string
  username: string
  role: UserRole
  creatorStatus: CreatorStatus
  region: string
  state: string
  bio: string
  avatarUrl: string
  gender?: Gender
  creatorVerifiedAt?: Date
  createdAt: Date
}

export function toPublicProfile(
  user: UserDocument & { _id: mongoose.Types.ObjectId },
  social: ProfileSocial = { followerCount: 0, followingCount: 0, isFollowing: false },
): PublicProfile {
  return {
    id: String(user._id),
    username: user.username,
    role: user.role,
    creatorStatus: user.creatorStatus ?? 'none',
    region: user.region,
    state: user.state ?? '',
    bio: user.bio ?? '',
    avatarUrl: user.avatarUrl ?? '',
    ...(user.gender ? { gender: user.gender } : {}),
    ...(user.creatorVerifiedAt ? { creatorVerifiedAt: user.creatorVerifiedAt } : {}),
    createdAt: user.createdAt,
    ...social,
  }
}

/** Compact account card used by creator search and follower/following lists. */
export interface FollowUserSummary extends ProfileSocial {
  id: string
  username: string
  role: UserRole
  creatorStatus: CreatorStatus
  region: string
  state: string
  bio: string
  avatarUrl: string
}

export const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ??
  mongoose.model<UserDocument>('User', userSchema)
