import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export type PostMediaType = 'none' | 'image' | 'video'

export interface PostDocument {
  author: mongoose.Types.ObjectId
  /** Denormalised author name — keeps the feed fast and renders like the original UI. */
  authorName: string
  /** Denormalised username so every post can link to its author's page. */
  authorUsername?: string
  /** Denormalised profile photo so feed avatars stay in sync with the author. */
  authorAvatarUrl?: string
  /** Denormalised author role ('user' | 'creator' | 'student' | 'lecturer' | 'admin'). */
  authorRole: 'user' | 'creator' | 'student' | 'lecturer' | 'admin'
  content: string
  /** Optional subject / course tag used by the composer. */
  subject?: string
  /** Optional class level (Primary 1 … University 600 Level). */
  classLevel?: string
  mediaType: PostMediaType
  mediaUrl?: string
  likeCount: number
  commentCount: number
  createdAt: Date
  updatedAt: Date
}

export type Post = HydratedDocument<PostDocument>

const postSchema = new Schema<PostDocument>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String, required: true },
    authorUsername: { type: String, trim: true, index: true },
    authorAvatarUrl: { type: String, trim: true, maxlength: 500 },
    authorRole: {
      type: String,
      enum: ['user', 'creator', 'student', 'lecturer', 'admin'] as const,
      default: 'student',
    },
    content: { type: String, required: true, maxlength: 5000 },
    subject: { type: String, maxlength: 120 },
    classLevel: { type: String, maxlength: 120 },
    mediaType: {
      type: String,
      enum: ['none', 'image', 'video'] as const,
      default: 'none',
    },
    mediaUrl: { type: String },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
)

// The feed is ordered newest-first and filtered by author or subject.
postSchema.index({ createdAt: -1 })
postSchema.index({ authorRole: 1, createdAt: -1 })
postSchema.index({ subject: 1, createdAt: -1 })
postSchema.index({ classLevel: 1, createdAt: -1 })

/** Shape returned to the client for a single post. */
export interface PostDto {
  id: string
  authorId: string
  author: string
  authorUsername?: string
  authorAvatarUrl?: string
  authorRole: 'user' | 'creator' | 'student' | 'lecturer' | 'admin'
  content: string
  subject?: string
  classLevel?: string
  mediaType: PostMediaType
  mediaUrl?: string
  likes: number
  comments: number
  likedByMe: boolean
  timestamp: string
  canDelete: boolean
}

export function toPostDto(
  post: PostDocument & { _id: mongoose.Types.ObjectId },
  options: { likedByMe?: boolean; canDelete?: boolean } = {},
): PostDto {
  return {
    id: String(post._id),
    authorId: String(post.author),
    author: post.authorName,
    ...(post.authorUsername ? { authorUsername: post.authorUsername } : {}),
    ...(post.authorAvatarUrl ? { authorAvatarUrl: post.authorAvatarUrl } : {}),
    authorRole: post.authorRole,
    content: post.content,
    ...(post.subject ? { subject: post.subject } : {}),
    ...(post.classLevel ? { classLevel: post.classLevel } : {}),
    mediaType: post.mediaType,
    ...(post.mediaUrl ? { mediaUrl: post.mediaUrl } : {}),
    likes: post.likeCount,
    comments: post.commentCount,
    likedByMe: options.likedByMe ?? false,
    timestamp: post.createdAt.toISOString(),
    canDelete: options.canDelete ?? false,
  }
}

export const PostModel: Model<PostDocument> =
  (mongoose.models.Post as Model<PostDocument>) ??
  mongoose.model<PostDocument>('Post', postSchema)
