import crypto from 'node:crypto'
import mongoose from 'mongoose'
import { env } from '../../config/env.js'
import { AppError } from '../../common/errors/AppError.js'
import { hashOpaqueToken } from '../../common/utils/jwt.js'
import { sendCreatorVerificationEmail, sendCreatorWelcomeEmail } from '../../common/email/mailer.js'
import { PostModel } from '../posts/post.model.js'
import {
  UserModel,
  toPublicUser,
  type PublicUser,
} from '../users/user.model.js'
import {
  createSubaccount,
  listBanks,
  resolveBankAccount,
  type PaystackBank,
} from '../payments/paystack.client.js'
import {
  CreatorProfileModel,
  type CreatorApplicationStatus,
  type CreatorProfile,
} from './creator.model.js'
import type { ApplyCreatorInput } from './creator.validation.js'

export interface CreatorDto {
  id: string
  userId: string
  username: string
  email: string
  displayName: string
  bio: string
  status: CreatorApplicationStatus
  bankName: string
  accountNumber: string
  accountName: string
  sharePercent: number
  platformSharePercent: number
  paystackSubaccountCode?: string
  appliedAt: string
  reviewedAt?: string
  rejectionReason?: string
}

interface PopulatedCreator {
  _id: unknown
  user:
    | {
        _id: unknown
        username?: string
        email?: string
      }
    | null
    | undefined
  displayName: string
  bio: string
  status: CreatorApplicationStatus
  bankName: string
  accountNumber: string
  accountName: string
  sharePercent: number
  platformSharePercent?: number
  paystackSubaccountCode?: string
  appliedAt: Date
  reviewedAt?: Date
  rejectionReason?: string
}

function toCreatorDto(profile: PopulatedCreator): CreatorDto {
  const user = profile.user
  return {
    id: String(profile._id),
    userId: user ? String(user._id) : '',
    username: user?.username ?? '',
    email: user?.email ?? '',
    displayName: profile.displayName,
    bio: profile.bio,
    status: profile.status,
    bankName: profile.bankName,
    accountNumber: profile.accountNumber,
    accountName: profile.accountName,
    sharePercent: profile.sharePercent,
    platformSharePercent: 100 - profile.sharePercent,
    ...(profile.paystackSubaccountCode
      ? { paystackSubaccountCode: profile.paystackSubaccountCode }
      : {}),
    appliedAt: profile.appliedAt.toISOString(),
    ...(profile.reviewedAt ? { reviewedAt: profile.reviewedAt.toISOString() } : {}),
    ...(profile.rejectionReason ? { rejectionReason: profile.rejectionReason } : {}),
  }
}

let bankCache: { banks: PaystackBank[]; expiresAt: number } | null = null

/** Bank lists change rarely; keep them for an hour to avoid extra API calls. */
export async function getBanks(): Promise<PaystackBank[]> {
  if (bankCache && bankCache.expiresAt > Date.now()) return bankCache.banks
  const banks = await listBanks(env.PAYSTACK_CURRENCY)
  bankCache = { banks, expiresAt: Date.now() + 60 * 60 * 1000 }
  return banks
}

async function bankNameFor(code: string): Promise<string> {
  try {
    const banks = await getBanks()
    return banks.find((bank) => bank.code === code)?.name ?? code
  } catch {
    // Bank resolution already succeeded; a missing display name is cosmetic.
    return code
  }
}

export async function applyAsCreator(
  userId: string,
  input: ApplyCreatorInput,
): Promise<CreatorDto> {
  const user = await UserModel.findById(userId).select('_id email username creatorStatus').lean()
  if (!user) {
    throw AppError.notFound('Account not found')
  }
  if (user.creatorStatus === 'approved') {
    throw AppError.conflict('You are already an approved creator.')
  }

  const existing = await CreatorProfileModel.findOne({ user: userId })
  if (existing?.status === 'pending') {
    throw AppError.conflict('Your creator application is already under review.')
  }

  const resolved = await resolveBankAccount(input.accountNumber, input.bankCode)
  const bankName = await bankNameFor(input.bankCode)
  const sharePercent = env.creatorSharePercent

  const profile =
    existing ??
    new CreatorProfileModel({
      user: userId,
      displayName: input.displayName,
      bio: input.bio,
      status: 'pending',
      bankCode: input.bankCode,
      bankName,
      accountNumber: input.accountNumber,
      accountName: resolved.accountName,
      sharePercent,
      appliedAt: new Date(),
    })

  profile.displayName = input.displayName
  profile.bio = input.bio
  profile.status = 'pending'
  profile.bankCode = input.bankCode
  profile.bankName = bankName
  profile.accountNumber = input.accountNumber
  profile.accountName = resolved.accountName
  profile.sharePercent = sharePercent
  profile.appliedAt = new Date()
  profile.reviewedAt = undefined
  profile.reviewedBy = undefined
  profile.rejectionReason = undefined
  await profile.save()

  await UserModel.updateOne({ _id: userId }, { $set: { creatorStatus: 'pending' } })

  return toCreatorDto({
    ...profile.toObject(),
    user: { _id: user._id, username: user.username, email: user.email },
  })
}

/**
 * Emails a fresh six-digit code that lets the signed-in user become a verified
 * creator. Codes are stored hashed and expire after ten minutes.
 */
export async function requestCreatorVerification(
  userId: string,
): Promise<{ email: string; delivered: boolean; devCode?: string; previewUrl?: string }> {
  const user = await UserModel.findById(userId)
  if (!user) {
    throw AppError.notFound('Account not found')
  }
  if (user.creatorStatus === 'approved') {
    throw AppError.conflict('Your account is already verified as a creator.')
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  user.creatorVerificationCodeHash = hashOpaqueToken(code)
  user.creatorVerificationExpires = new Date(Date.now() + 10 * 60 * 1000)
  await user.save()

  const mail = await sendCreatorVerificationEmail(user.email, user.username, code)

  // Ethereal captures the email in a preview inbox, so it never reaches the
  // user's real address. In that mode we return only the preview link, not the
  // code. The code is returned only when there is no mail provider at all or a
  // real provider could not accept the message, so local testing still works.
  const previewMode = mail.provider === 'ethereal' && Boolean(mail.previewUrl)
  const showDevCode =
    !env.isProduction &&
    !previewMode &&
    (mail.provider === 'console' || mail.provider === 'ethereal' || !mail.delivered)

  return {
    email: user.email,
    delivered: mail.delivered && !previewMode,
    ...(!env.isProduction && mail.previewUrl && previewMode
      ? { previewUrl: mail.previewUrl }
      : {}),
    ...(showDevCode ? { devCode: code } : {}),
  }
}

/** Confirms the emailed code and upgrades the account to a verified creator. */
export async function confirmCreatorVerification(
  userId: string,
  code: string,
): Promise<{ user: PublicUser; message: string }> {
  const user = await UserModel.findById(userId).select(
    '+creatorVerificationCodeHash +creatorVerificationExpires',
  )
  if (!user) {
    throw AppError.notFound('Account not found')
  }

  if (
    !user.creatorVerificationCodeHash ||
    !user.creatorVerificationExpires ||
    user.creatorVerificationExpires.getTime() <= Date.now()
  ) {
    throw AppError.badRequest('That code is invalid or has expired. Request a new one.')
  }

  if (user.creatorVerificationCodeHash !== hashOpaqueToken(code)) {
    throw AppError.badRequest('That code is not correct. Please check it and try again.')
  }

  user.creatorStatus = 'approved'
  if (user.role !== 'admin') {
    user.role = 'creator'
  }
  user.emailVerified = true
  user.creatorVerifiedAt = new Date()
  user.creatorVerificationCodeHash = undefined
  user.creatorVerificationExpires = undefined
  await user.save()

  // Existing posts should immediately carry the creator badge too.
  await PostModel.updateMany(
    { author: user._id },
    {
      $set: {
        authorRole: 'creator',
        authorName: user.username,
        authorUsername: user.username,
      },
    },
  )

  const profileUrl = `${env.CLIENT_APP_URL.replace(/\/$/, '')}/u/${encodeURIComponent(user.username)}`
  // The welcome message is a nice-to-have; never block a successful verification on it.
  void sendCreatorWelcomeEmail(user.email, user.username, profileUrl).catch(() => undefined)

  return {
    user: toPublicUser(user),
    message: 'Welcome to being a creator! You can now upload videos and media.',
  }
}

export async function getMyCreatorProfile(userId: string): Promise<CreatorDto | null> {
  const profile = await CreatorProfileModel.findOne({ user: userId })
    .populate('user', 'username email')
    .lean()
  return profile ? toCreatorDto(profile as unknown as PopulatedCreator) : null
}

export async function listCreatorApplications(
  status?: CreatorApplicationStatus,
): Promise<CreatorDto[]> {
  const filter = status ? { status } : {}
  const profiles = await CreatorProfileModel.find(filter)
    .populate('user', 'username email')
    .sort({ createdAt: -1 })
    .lean()
  return profiles.map((profile) => toCreatorDto(profile as unknown as PopulatedCreator))
}

export async function approveCreator(creatorId: string, adminId: string): Promise<CreatorDto> {
  const profile = await CreatorProfileModel.findById(creatorId)
  if (!profile) {
    throw AppError.notFound('Creator application not found')
  }

  if (profile.status === 'approved' && profile.paystackSubaccountCode) {
    return getCreatorById(creatorId)
  }

  const user = await UserModel.findById(profile.user).select('username email').lean()
  if (!user) {
    throw AppError.notFound('The creator account no longer exists')
  }

  const subaccount = await createSubaccount({
    businessName: profile.displayName,
    bankCode: profile.bankCode,
    accountNumber: profile.accountNumber,
    percentageCharge: 100 - profile.sharePercent,
    email: user.email,
  })

  profile.status = 'approved'
  profile.paystackSubaccountCode = subaccount.subaccountCode
  profile.accountName = subaccount.accountName || profile.accountName
  profile.reviewedAt = new Date()
  profile.reviewedBy = new mongoose.Types.ObjectId(adminId)
  profile.rejectionReason = undefined
  await profile.save()

  await UserModel.updateOne({ _id: profile.user }, { $set: { creatorStatus: 'approved' } })

  return getCreatorById(creatorId)
}

export async function rejectCreator(
  creatorId: string,
  adminId: string,
  reason: string,
): Promise<CreatorDto> {
  const profile = await CreatorProfileModel.findById(creatorId)
  if (!profile) {
    throw AppError.notFound('Creator application not found')
  }

  profile.status = 'rejected'
  profile.rejectionReason = reason
  profile.reviewedAt = new Date()
  profile.reviewedBy = new mongoose.Types.ObjectId(adminId)
  await profile.save()

  await UserModel.updateOne({ _id: profile.user }, { $set: { creatorStatus: 'rejected' } })

  return getCreatorById(creatorId)
}

async function getCreatorById(creatorId: string): Promise<CreatorDto> {
  const profile = await CreatorProfileModel.findById(creatorId)
    .populate('user', 'username email')
    .lean()
  if (!profile) throw AppError.notFound('Creator not found')
  return toCreatorDto(profile as unknown as PopulatedCreator)
}

/** Returns the payout profile for an approved creator, if one exists. */
export async function getApprovedCreator(
  userId: string,
): Promise<CreatorProfile | null> {
  return CreatorProfileModel.findOne({ user: userId, status: 'approved' })
}


