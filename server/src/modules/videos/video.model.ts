import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'

export type VideoStatus =
  | 'draft'
  | 'uploading'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'failed'

/**
 * A paid video in the Talma library.
 *
 * New videos are uploaded to Talma's YouTube channel through a resumable
 * session URL: the browser sends the file straight to Google and the API only
 * stores metadata. The video stays `private` on YouTube until an administrator
 * approves it, then it is switched to `unlisted` and offered in the catalogue.
 */
export interface VideoDocument {
  title: string
  description: string
  /** Curriculum subject used to organise and filter the library. */
  subject: string
  /** Class or year group, from Primary 1 through University 600 Level. */
  classLevel: string
  /** Empty until the browser finishes the YouTube upload. */
  youtubeVideoId: string
  /** One-time resumable session URL; never exposed in public payloads. */
  youtubeUploadUrl?: string
  uploadExpiresAt?: Date
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
    youtubeVideoId: { type: String, default: '', trim: true },
    youtubeUploadUrl: { type: String },
    uploadExpiresAt: { type: Date },
    durationSeconds: { type: Number, default: 0, min: 0 },
    priceKobo: { type: Number, required: true, min: 0, default: 200_000 },
    currency: { type: String, required: true, default: 'NGN', uppercase: true, trim: true },
    published: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['draft', 'uploading', 'pending_review', 'published', 'rejected', 'failed'] as const,
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
