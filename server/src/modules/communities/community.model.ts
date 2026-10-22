import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export interface CommunityDocument {
  name: string
  desc: string
  category: string
  school: string
  members: number
  /** Bootstrap icon class, matching the original directory data. */
  icon: string
  /** Tailwind gradient classes for the tile background. */
  bg: string
  iconColor: string
  lastActive: string
  createdBy?: mongoose.Types.ObjectId
  /** Seeded communities are part of the shared directory. */
  isDirectoryEntry: boolean
  /** Stable key used to re-seed the shared directory without duplicating rows. */
  directoryKey?: string
  createdAt: Date
  updatedAt: Date
}

export type Community = HydratedDocument<CommunityDocument>

const communitySchema = new Schema<CommunityDocument>(
  {
    name: { type: String, required: true, trim: true },
    desc: { type: String, default: '' },
    category: { type: String, default: 'Study Group', index: true },
    school: { type: String, default: 'All schools' },
    members: { type: Number, default: 1, min: 0 },
    icon: { type: String, default: 'bi-people' },
    bg: { type: String, default: 'from-[#FBF3E4] to-[#F5E6C8]' },
    iconColor: { type: String, default: 'text-[#C6862E]' },
    lastActive: { type: String, default: 'just now' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDirectoryEntry: { type: Boolean, default: false },
    directoryKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true, versionKey: false },
)

communitySchema.index({ name: 1 })
communitySchema.index({ createdAt: -1 })

export interface CommunityDto {
  id: string
  name: string
  desc: string
  category: string
  school: string
  members: number
  icon: string
  bg: string
  iconColor: string
  lastActive: string
  joined: boolean
  isDirectoryEntry: boolean
}

export function toCommunityDto(
  community: CommunityDocument & { _id: mongoose.Types.ObjectId },
  joined: boolean,
): CommunityDto {
  return {
    id: String(community._id),
    name: community.name,
    desc: community.desc,
    category: community.category,
    school: community.school,
    members: community.members,
    icon: community.icon,
    bg: community.bg,
    iconColor: community.iconColor,
    lastActive: community.lastActive,
    joined,
    isDirectoryEntry: community.isDirectoryEntry,
  }
}

export const CommunityModel: Model<CommunityDocument> =
  (mongoose.models.Community as Model<CommunityDocument>) ??
  mongoose.model<CommunityDocument>('Community', communitySchema)
