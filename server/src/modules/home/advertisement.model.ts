import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'

export type AdvertisementKind = 'school' | 'teaching'

export interface AdvertisementDocument {
  kind: AdvertisementKind
  /** School name or job title. */
  title: string
  subtitle: string
  description: string
  location: string
  badge: string
  ctaLabel: string
  ctaUrl: string
  authorId: mongoose.Types.ObjectId
  authorName: string
  createdAt: Date
  updatedAt: Date
}

export type Advertisement = HydratedDocument<AdvertisementDocument>

const advertisementSchema = new Schema<AdvertisementDocument>(
  {
    kind: {
      type: String,
      enum: ['school', 'teaching'] as const,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subtitle: { type: String, default: '', trim: true, maxlength: 160 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    location: { type: String, default: '', trim: true, maxlength: 120 },
    badge: { type: String, default: '', trim: true, maxlength: 40 },
    ctaLabel: { type: String, default: '', trim: true, maxlength: 40 },
    ctaUrl: { type: String, required: true, trim: true, maxlength: 500 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String, required: true, trim: true, maxlength: 72 },
  },
  { timestamps: true, versionKey: false },
)

advertisementSchema.index({ kind: 1, createdAt: -1 })

export const AdvertisementModel =
  (mongoose.models.Advertisement as Model<AdvertisementDocument>) ??
  mongoose.model<AdvertisementDocument>('Advertisement', advertisementSchema)

export interface AdvertisementDto {
  id: string
  kind: AdvertisementKind
  title: string
  subtitle: string
  description: string
  location: string
  badge: string
  ctaLabel: string
  ctaUrl: string
  authorUsername?: string
  createdAt?: string
}

/** Serialises a database advert for the Home screens. */
export function toAdvertisementDto(
  advertisement: AdvertisementDocument & { _id: mongoose.Types.ObjectId },
): AdvertisementDto {
  return {
    id: String(advertisement._id),
    kind: advertisement.kind,
    title: advertisement.title,
    subtitle: advertisement.subtitle,
    description: advertisement.description,
    location: advertisement.location,
    badge: advertisement.badge,
    ctaLabel: advertisement.ctaLabel,
    ctaUrl: advertisement.ctaUrl,
    authorUsername: advertisement.authorName,
    createdAt: advertisement.createdAt.toISOString(),
  }
}
