import { AppError } from '../../common/errors/AppError.js'
import { hashPassword, verifyPassword } from '../../common/utils/password.js'
import { UserModel, toPublicUser, type PublicUser } from './user.model.js'
import { RefreshSessionModel } from '../auth/refreshSession.model.js'
import { PostModel } from '../posts/post.model.js'
import { ReactionModel } from '../posts/reaction.model.js'
import { MessageModel } from '../messages/message.model.js'
import { NotificationModel } from '../notifications/notification.model.js'
import { AssignmentModel } from '../assignments/assignment.model.js'
import { AssignmentSubmissionModel } from '../assignments/assignmentSubmission.model.js'
import { CommunityModel } from '../communities/community.model.js'
import { CommunityMembershipModel } from '../communities/communityMembership.model.js'
import { EnrollmentModel } from '../courses/enrollment.model.js'
import { TestAttemptModel } from '../tests/testAttempt.model.js'
import type { UpdateProfileInput } from './user.validation.js'

/** Updates the authenticated user's profile. */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  const user = await UserModel.findById(userId)
  if (!user) {
    throw AppError.notFound('Account not found')
  }

  if (input.username && input.username !== user.username) {
    const normalized = input.username.toLowerCase()
    const taken = await UserModel.findOne({ usernameNormalized: normalized, _id: { $ne: user._id } })
      .select('_id')
      .lean()
    if (taken) {
      throw AppError.conflict('That username is already taken')
    }
    user.username = input.username
    user.usernameNormalized = normalized
  }

  if (input.region !== undefined) user.region = input.region
  if (input.language !== undefined) user.language = input.language
  if (input.timezone !== undefined) user.timezone = input.timezone
  if (input.privacyPublic !== undefined) user.privacyPublic = input.privacyPublic
  if (input.emailNotifications !== undefined) user.emailNotifications = input.emailNotifications

  await user.save()
  return toPublicUser(user)
}

/** Changes the authenticated user's password (requires the current one). */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await UserModel.findById(userId).select('+passwordHash')
  if (!user) {
    throw AppError.notFound('Account not found')
  }

  const valid = await verifyPassword(user.passwordHash, currentPassword)
  if (!valid) {
    throw AppError.badRequest('Your current password is incorrect')
  }

  user.passwordHash = await hashPassword(newPassword)
  await user.save()

  await RefreshSessionModel.updateMany(
    { user: user._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  )
}

/**
 * Permanently deletes the account and everything that belongs to it.
 * The user document is the owner of the data, so it is removed last.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const user = await UserModel.findById(userId)
  if (!user) {
    throw AppError.notFound('Account not found')
  }

  const postIds = await PostModel.find({ author: user._id }).distinct('_id')

  await Promise.all([
    ReactionModel.deleteMany({ user: user._id }),
    ReactionModel.deleteMany({ post: { $in: postIds } }),
    PostModel.deleteMany({ author: user._id }),
    MessageModel.deleteMany({ $or: [{ sender: user._id }, { recipient: user._id }] }),
    NotificationModel.deleteMany({ user: user._id }),
    AssignmentSubmissionModel.deleteMany({ user: user._id }),
    AssignmentModel.deleteMany({ createdBy: user._id }),
    CommunityMembershipModel.deleteMany({ user: user._id }),
    CommunityModel.deleteMany({ createdBy: user._id }),
    EnrollmentModel.deleteMany({ user: user._id }),
    TestAttemptModel.deleteMany({ user: user._id }),
    RefreshSessionModel.deleteMany({ user: user._id }),
  ])

  await user.deleteOne()
}

/** Looks up a public profile by username. */
export async function getPublicProfile(username: string): Promise<PublicUser> {
  const user = await UserModel.findOne({
    usernameNormalized: username.toLowerCase(),
    privacyPublic: true,
  })
  if (!user) {
    throw AppError.notFound('That profile could not be found')
  }
  return toPublicUser(user)
}

/** Returns the authenticated user's own profile (ignores the privacy flag). */
export async function getPublicUser(userId: string): Promise<PublicUser> {
  const user = await UserModel.findById(userId)
  if (!user) {
    throw AppError.notFound('Account not found')
  }
  return toPublicUser(user)
}
