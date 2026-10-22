import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export interface MessageDocument {
  sender: mongoose.Types.ObjectId
  /** Denormalised sender name so the inbox renders without extra joins. */
  senderName: string
  recipient: mongoose.Types.ObjectId
  subject: string
  preview: string
  body: string
  unread: boolean
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type Message = HydratedDocument<MessageDocument>

const messageSchema = new Schema<MessageDocument>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true },
    preview: { type: String, default: '' },
    body: { type: String, default: '' },
    unread: { type: Boolean, default: true },
    readAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
)

messageSchema.index({ recipient: 1, createdAt: -1 })

export interface MessageDto {
  id: string
  sender: string
  subject: string
  preview: string
  body: string
  time: string
  unread: boolean
  createdAt: string
}

export function toMessageDto(message: MessageDocument & { _id: mongoose.Types.ObjectId }): MessageDto {
  return {
    id: String(message._id),
    sender: message.senderName,
    subject: message.subject,
    preview: message.preview,
    body: message.body,
    time: formatRelativeTime(message.createdAt),
    unread: message.unread,
    createdAt: message.createdAt.toISOString(),
  }
}

/** Renders a timestamp the same way the original inbox did ("2 hours ago"). */
export function formatRelativeTime(value: Date): string {
  const diff = Date.now() - value.getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

export const MessageModel: Model<MessageDocument> =
  (mongoose.models.Message as Model<MessageDocument>) ??
  mongoose.model<MessageDocument>('Message', messageSchema)
