import mongoose from 'mongoose'
import { AppError } from '../../common/errors/AppError.js'
import { paginate, toSkip, type Paginated } from '../../common/utils/pagination.js'
import { UserModel } from '../users/user.model.js'
import { PostModel, toPostDto, type PostDto } from './post.model.js'
import { ReactionModel } from './reaction.model.js'
import type { CreatePostInput, FeedQuery } from './post.validation.js'

/** Creates a post authored by the given user. */
export async function createPost(
  authorId: string,
  input: CreatePostInput,
): Promise<PostDto> {
  const author = await UserModel.findById(authorId).select('username role').lean()
  if (!author) {
    throw AppError.notFound('Account not found')
  }

  const post = await PostModel.create({
    author: author._id,
    authorName: author.username,
    authorRole: author.role,
    content: input.content,
    ...(input.subject ? { subject: input.subject } : {}),
    mediaType: input.mediaType,
    ...(input.mediaUrl ? { mediaUrl: input.mediaUrl } : {}),
  })

  return toPostDto(post.toObject(), { likedByMe: false, canDelete: true })
}

/**
 * Returns a page of posts for the requested feed.
 *
 * - `foryou`    → every post, newest first.
 * - `following` → posts written by lecturers (the original "Following" tab).
 * - `discover`  → every post, optionally narrowed by a free-text search.
 */
export async function listPosts(
  query: FeedQuery,
  viewerId: string | undefined,
): Promise<Paginated<PostDto>> {
  const filter: mongoose.FilterQuery<Record<string, unknown>> = {}

  if (query.feed === 'following') {
    filter.authorRole = 'lecturer'
    // The original "Following" tab fell back to the whole feed when no
    // lecturer had posted yet.
    const lecturerCount = await PostModel.countDocuments({ authorRole: 'lecturer' })
    if (lecturerCount === 0) {
      delete filter.authorRole
    }
  }

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(escaped, 'i')
    filter.$or = [
      { content: pattern },
      { authorName: pattern },
      { subject: pattern },
    ]
  }

  const [posts, total] = await Promise.all([
    PostModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(toSkip(query.page, query.limit))
      .limit(query.limit)
      .lean(),
    PostModel.countDocuments(filter),
  ])

  const likedPostIds = viewerId
    ? await ReactionModel.find({ user: viewerId, post: { $in: posts.map((p) => p._id) } })
        .distinct('post')
    : []

  const items = posts.map((post) =>
    toPostDto(post, {
      likedByMe: likedPostIds.some((id) => String(id) === String(post._id)),
      canDelete: viewerId !== undefined && String(post.author) === viewerId,
    }),
  )

  return paginate(items, total, query)
}

/** Likes a post (idempotent). */
export async function likePost(postId: string, userId: string): Promise<PostDto> {
  const post = await PostModel.findById(postId)
  if (!post) {
    throw AppError.notFound('Post not found')
  }

  // The upsert keeps the operation atomic even when two requests race.
  const result = await ReactionModel.updateOne(
    { post: post._id, user: userId },
    { $setOnInsert: { post: post._id, user: userId } },
    { upsert: true },
  )

  if (result.upsertedCount > 0) {
    post.likeCount += 1
    await post.save()
  }

  return toPostDto(post.toObject(), { likedByMe: true, canDelete: false })
}

/** Removes a like from a post (idempotent). */
export async function unlikePost(postId: string, userId: string): Promise<PostDto> {
  const post = await PostModel.findById(postId)
  if (!post) {
    throw AppError.notFound('Post not found')
  }

  const removed = await ReactionModel.findOneAndDelete({ post: post._id, user: userId })
  if (removed) {
    post.likeCount = Math.max(0, post.likeCount - 1)
    await post.save()
  }

  return toPostDto(post.toObject(), { likedByMe: false, canDelete: false })
}

/**
 * Deletes a post. Only the author or an administrator may do so — the check
 * happens on the server, not in the UI.
 */
export async function deletePost(
  postId: string,
  viewerId: string,
  viewerRole: string,
): Promise<void> {
  const post = await PostModel.findById(postId)
  if (!post) {
    throw AppError.notFound('Post not found')
  }

  const isOwner = String(post.author) === viewerId
  if (!isOwner && viewerRole !== 'admin') {
    throw AppError.forbidden('You can only delete your own posts')
  }

  await Promise.all([
    ReactionModel.deleteMany({ post: post._id }),
    PostModel.deleteOne({ _id: post._id }),
  ])
}
