import mongoose from 'mongoose'
import { AppError } from '../../common/errors/AppError.js'
import { hashPassword, verifyPassword } from '../../common/utils/password.js'
import {
  UserModel,
  toPublicProfile,
  toPublicUser,
  type FollowUserSummary,
  type ProfileSocial,
  type PublicProfile,
  type PublicUser,
  type UserDocument,
} from './user.model.js'
import { FollowModel } from './follow.model.js'
import { RefreshSessionModel } from '../auth/refreshSession.model.js'
import { PostModel, toPostDto, type PostDto } from '../posts/post.model.js'
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
    await PostModel.updateMany(
      { author: user._id },
      { $set: { authorName: input.username, authorUsername: input.username } },
    )
  }

  if (input.region !== undefined) user.region = input.region
  if (input.state !== undefined) user.state = input.state
  if (input.language !== undefined) user.language = input.language
  if (input.timezone !== undefined) user.timezone = input.timezone
  if (input.bio !== undefined) user.bio = input.bio
  if (input.avatarUrl !== undefined && input.avatarUrl !== user.avatarUrl) {
    user.avatarUrl = input.avatarUrl
    await PostModel.updateMany(
      { author: user._id },
      { $set: { authorAvatarUrl: input.avatarUrl } },
    )
  }
  if (input.gender !== undefined) user.gender = input.gender
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
    FollowModel.deleteMany({ $or: [{ follower: user._id }, { following: user._id }] }),
    RefreshSessionModel.deleteMany({ user: user._id }),
  ])

  await user.deleteOne()
}

type UserWithId = UserDocument & { _id: mongoose.Types.ObjectId }

/** Finds an account by username or MongoDB id. */
async function findAccount(usernameOrId: string): Promise<UserWithId> {
  const isId = /^[a-f\d]{24}$/i.test(usernameOrId)
  const user = await UserModel.findOne(
    isId ? { _id: usernameOrId } : { usernameNormalized: usernameOrId.toLowerCase() },
  )

  if (!user) {
    throw AppError.notFound('That profile could not be found')
  }

  return user as UserWithId
}

/** Like `findAccount`, but hides private profiles from everyone except their owner. */
async function findVisibleAccount(
  usernameOrId: string,
  viewerId?: string,
): Promise<UserWithId> {
  const user = await findAccount(usernameOrId)
  const isOwner = viewerId !== undefined && String(user._id) === viewerId
  if (!user.privacyPublic && !isOwner) {
    throw AppError.notFound('That profile could not be found')
  }
  return user
}

/** Returns the follower/following counters for one account. */
async function profileSocial(targetId: string, viewerId?: string): Promise<ProfileSocial> {
  const [followerCount, followingCount, follows] = await Promise.all([
    FollowModel.countDocuments({ following: targetId }),
    FollowModel.countDocuments({ follower: targetId }),
    viewerId && viewerId !== targetId
      ? FollowModel.exists({ follower: viewerId, following: targetId })
      : null,
  ])

  return { followerCount, followingCount, isFollowing: Boolean(follows) }
}

/** Adds social counters to a list of account documents in one pass. */
async function buildUserSummaries(
  users: UserWithId[],
  viewerId?: string,
): Promise<FollowUserSummary[]> {
  if (users.length === 0) return []

  const ids = users.map((user) => user._id)
  const [followerRows, followingRows, viewerFollowIds] = await Promise.all([
    FollowModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { following: { $in: ids } } },
      { $group: { _id: '$following', count: { $sum: 1 } } },
    ]),
    FollowModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { follower: { $in: ids } } },
      { $group: { _id: '$follower', count: { $sum: 1 } } },
    ]),
    viewerId
      ? FollowModel.find({ follower: viewerId, following: { $in: ids } }).distinct('following')
      : Promise.resolve([]),
  ])

  const followerMap = new Map(followerRows.map((row) => [String(row._id), row.count]))
  const followingMap = new Map(followingRows.map((row) => [String(row._id), row.count]))
  const viewerFollowing = new Set((viewerFollowIds as unknown[]).map(String))

  return users.map((user) => ({
    id: String(user._id),
    username: user.username,
    role: user.role,
    creatorStatus: user.creatorStatus ?? 'none',
    region: user.region,
    state: user.state ?? '',
    bio: user.bio ?? '',
    avatarUrl: user.avatarUrl ?? '',
    followerCount: followerMap.get(String(user._id)) ?? 0,
    followingCount: followingMap.get(String(user._id)) ?? 0,
    isFollowing: viewerFollowing.has(String(user._id)),
  }))
}

/** Looks up a public profile (and everything they have posted) by username or id. */
export async function getPublicProfile(
  usernameOrId: string,
  viewerId?: string,
): Promise<{ user: PublicProfile; posts: PostDto[] }> {
  const user = await findVisibleAccount(usernameOrId, viewerId)

  const posts = await PostModel.find({ author: user._id }).sort({ createdAt: -1 }).limit(200).lean()

  const [social, likedPostIds] = await Promise.all([
    profileSocial(String(user._id), viewerId),
    viewerId
      ? ReactionModel.find({
          user: viewerId,
          post: { $in: posts.map((post) => post._id) },
        }).distinct('post')
      : Promise.resolve([]),
  ])

  return {
    user: toPublicProfile(user, social),
    posts: posts.map((post) =>
      toPostDto(post, {
        likedByMe: likedPostIds.some((id) => String(id) === String(post._id)),
        canDelete: viewerId !== undefined && String(post.author) === viewerId,
      }),
    ),
  }
}

/**
 * Searches public accounts by name or bio. With no search term it returns the
 * verified creators, which makes the search sheet useful straight away.
 */
export async function searchProfiles(
  term: string,
  viewerId?: string,
): Promise<FollowUserSummary[]> {
  const filter: mongoose.FilterQuery<UserDocument> = { privacyPublic: true }
  if (viewerId) {
    filter._id = { $ne: new mongoose.Types.ObjectId(viewerId) }
  }

  const search = term.trim()
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(escaped, 'i')
    filter.$or = [
      { username: pattern },
      { bio: pattern },
      { region: pattern },
      { state: pattern },
    ]
  } else {
    filter.creatorStatus = 'approved'
  }

  const users = (await UserModel.find(filter).sort({ createdAt: -1 }).limit(40)) as UserWithId[]
  const summaries = await buildUserSummaries(users, viewerId)

  const rank = (account: FollowUserSummary): number => {
    if (account.creatorStatus === 'approved') return 0
    if (account.role === 'creator') return 1
    if (account.role === 'admin') return 2
    return 3
  }

  summaries.sort(
    (a, b) =>
      rank(a) - rank(b) ||
      b.followerCount - a.followerCount ||
      a.username.localeCompare(b.username),
  )

  return summaries.slice(0, 20)
}

/** Follows an account. Following is idempotent, so double-taps are harmless. */
export async function followProfile(
  usernameOrId: string,
  followerId: string,
): Promise<ProfileSocial> {
  const target = await findVisibleAccount(usernameOrId, followerId)
  if (String(target._id) === followerId) {
    throw AppError.badRequest('You cannot follow your own account')
  }

  await FollowModel.updateOne(
    { follower: followerId, following: target._id },
    { $setOnInsert: { follower: followerId, following: target._id } },
    { upsert: true },
  )

  return profileSocial(String(target._id), followerId)
}

/** Removes an existing follow relationship. */
export async function unfollowProfile(
  usernameOrId: string,
  followerId: string,
): Promise<ProfileSocial> {
  const target = await findAccount(usernameOrId)
  await FollowModel.deleteOne({ follower: followerId, following: target._id })
  return profileSocial(String(target._id), followerId)
}

/** Lists the public accounts following the requested profile. */
export async function listFollowers(
  usernameOrId: string,
  viewerId?: string,
): Promise<FollowUserSummary[]> {
  const target = await findVisibleAccount(usernameOrId, viewerId)
  const rows = await FollowModel.find({ following: target._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .select('follower')
    .lean()

  const ids = rows.map((row) => row.follower)
  const accounts = (await UserModel.find({
    _id: { $in: ids },
    privacyPublic: true,
  })) as UserWithId[]

  const byId = new Map(accounts.map((account) => [String(account._id), account]))
  const ordered = ids
    .map((id) => byId.get(String(id)))
    .filter((account): account is UserWithId => Boolean(account))

  return buildUserSummaries(ordered, viewerId)
}

/** Lists the public accounts the requested profile is following. */
export async function listFollowing(
  usernameOrId: string,
  viewerId?: string,
): Promise<FollowUserSummary[]> {
  const target = await findVisibleAccount(usernameOrId, viewerId)
  const rows = await FollowModel.find({ follower: target._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .select('following')
    .lean()

  const ids = rows.map((row) => row.following)
  const accounts = (await UserModel.find({
    _id: { $in: ids },
    privacyPublic: true,
  })) as UserWithId[]

  const byId = new Map(accounts.map((account) => [String(account._id), account]))
  const ordered = ids
    .map((id) => byId.get(String(id)))
    .filter((account): account is UserWithId => Boolean(account))

  return buildUserSummaries(ordered, viewerId)
}

/** Returns the authenticated user's own profile (ignores the privacy flag). */
export async function getPublicUser(userId: string): Promise<PublicUser> {
  const user = await UserModel.findById(userId)
  if (!user) {
    throw AppError.notFound('Account not found')
  }
  return toPublicUser(user)
}
