import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export type PostMediaType = 'none' | 'image' | 'video'

export interface PostDocument {
  author: mongoose.Types.ObjectId
  /** Denormalised author name — keeps the feed fast and renders like the original UI. */
  authorName: string
  /** Denormalised author role ('student' | 'lecturer' | 'admin'). */
  authorRole: 'student' | 'lecturer' | 'admin'
  content: string
  /** Optional subject / course tag used by the composer. */
  subject?: string
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
    authorRole: {
      type: String,
      enum: ['student', 'lecturer', 'admin'] as const,
      default: 'student',
    },
    content: { type: String, required: true, maxlength: 5000 },
    subject: { type: String, maxlength: 120 },
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

/** Shape returned to the client for a single post. */
export interface PostDto {
  id: string
  authorId: string
  author: string
  authorRole: 'student' | 'lecturer' | 'admin'
  content: string
  subject?: string
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
    authorRole: post.authorRole,
    content: post.content,
    ...(post.subject ? { subject: post.subject } : {}),
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
