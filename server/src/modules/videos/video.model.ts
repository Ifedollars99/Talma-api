import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'
import { VIDEO_MAX_PERIODS } from './video.options.js'

export type VideoStatus =
  | 'draft'
  | 'uploading'
  | 'processing'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'failed'

/** Where the actual video bytes live. Legacy entries default to YouTube. */
export type VideoProvider = 'youtube' | 'cloudflare'

export type StreamStatus = 'queued' | 'inprogress' | 'ready' | 'error'

/**
 * A paid video in the Talma library.
 *
 * New videos are uploaded to Cloudflare Stream through a one-time tus session
 * that the browser sends directly to Cloudflare. Stream videos are created with
 * signed URLs, so playback links expire and are locked to Talma's domains.
 * Legacy entries can still point at an unlisted YouTube video.
 */
export interface VideoDocument {
  title: string
  description: string
  /** Curriculum subject used to organise and filter the library. */
  subject: string
  /** Class or year group, from Primary 1 through University 600 Level. */
  classLevel: string
  /** Position of this lesson in a multi-part series, e.g. 2 in "2 of 4". */
  periodNumber?: number
  /** Total lessons in the series, e.g. 4 in "2 of 4". */
  periodTotal?: number
  /** `cloudflare` for new uploads; `youtube` for legacy entries. */
  provider: VideoProvider
  /** Empty for YouTube entries. */
  youtubeVideoId: string
  /** One-time resumable session URL; never exposed in public payloads. */
  youtubeUploadUrl?: string
  uploadExpiresAt?: Date
  /** Cloudflare Stream video id once a direct upload is provisioned. */
  streamUid?: string
  streamStatus?: StreamStatus
  /** One-time Cloudflare tus upload URL; never exposed in public payloads. */
  streamUploadUrl?: string
  streamUploadExpiresAt?: Date
  durationSeconds: number
  /** Price in the smallest currency unit (kobo for NGN). */
  priceKobo: number
  currency: string
  published: boolean
  status: VideoStatus
  createdBy: mongoose.Types.ObjectId
  /** The creator who uploaded the video. Absent for legacy/admin entries. */
  creator?: mongoose.Types.ObjectId
  /** Denormalised display name so catalogue responses need no extra query. */
  creatorName?: string
  /** Snapshot of the creator's share when the video was approved. */
  creatorSharePercent: number
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  rejectionReason?: string
  originalFileName?: string
  fileMimeType?: string
  fileSizeBytes?: number
  uploadedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type Video = HydratedDocument<VideoDocument>

const videoSchema = new Schema<VideoDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    // Defaults keep legacy catalogue entries editable; every new upload is
    // validated against the canonical lists in video.options.ts.
    subject: { type: String, default: '', trim: true, maxlength: 80 },
    classLevel: { type: String, default: '', trim: true, maxlength: 40 },
    periodNumber: { type: Number, min: 1, max: VIDEO_MAX_PERIODS },
    periodTotal: { type: Number, min: 1, max: VIDEO_MAX_PERIODS },
    provider: {
      type: String,
      enum: ['youtube', 'cloudflare'] as const,
      default: 'youtube',
      index: true,
    },
    youtubeVideoId: { type: String, default: '', trim: true },
    youtubeUploadUrl: { type: String },
    uploadExpiresAt: { type: Date },
    streamUid: { type: String, trim: true, index: true },
    streamStatus: {
      type: String,
      enum: ['queued', 'inprogress', 'ready', 'error'] as const,
    },
    streamUploadUrl: { type: String },
    streamUploadExpiresAt: { type: Date },
    durationSeconds: { type: Number, default: 0, min: 0 },
    priceKobo: { type: Number, required: true, min: 0, default: 200_000 },
    currency: { type: String, required: true, default: 'NGN', uppercase: true, trim: true },
    published: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: [
        'draft',
        'uploading',
        'processing',
        'pending_review',
        'published',
        'rejected',
        'failed',
      ] as const,
      default: 'draft',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    creatorName: { type: String, trim: true, maxlength: 80 },
    creatorSharePercent: { type: Number, default: 70, min: 0, max: 100 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    originalFileName: { type: String, trim: true, maxlength: 255 },
    fileMimeType: { type: String, trim: true },
    fileSizeBytes: { type: Number, min: 0 },
    uploadedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
)

videoSchema.index({ published: 1, createdAt: -1 })
videoSchema.index({ subject: 1, classLevel: 1, published: 1 })
videoSchema.index({ status: 1, createdAt: -1 })
videoSchema.index({ creator: 1, createdAt: -1 })

export const VideoModel: Model<VideoDocument> =
  (mongoose.models.Video as Model<VideoDocument>) ??
  mongoose.model<VideoDocument>('Video', videoSchema)
