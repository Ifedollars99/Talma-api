import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export type NotificationKind = 'message' | 'assignment' | 'community' | 'post' | 'system'

export interface NotificationDocument {
  user: mongoose.Types.ObjectId
  kind: NotificationKind
  title: string
  body: string
  /** Optional deep link into the app. */
  link?: string
  read: boolean
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type Notification = HydratedDocument<NotificationDocument>

const notificationSchema = new Schema<NotificationDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: {
      type: String,
      enum: ['message', 'assignment', 'community', 'post', 'system'] as const,
      default: 'system',
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    link: { type: String },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
)

notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ user: 1, read: 1 })

export interface NotificationDto {
  id: string
  kind: NotificationKind
  title: string
  body: string
  link?: string
  read: boolean
  createdAt: string
}

export function toNotificationDto(
  notification: NotificationDocument & { _id: mongoose.Types.ObjectId },
): NotificationDto {
  return {
    id: String(notification._id),
    kind: notification.kind,
    title: notification.title,
    body: notification.body,
    ...(notification.link ? { link: notification.link } : {}),
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  }
}

export const NotificationModel: Model<NotificationDocument> =
  (mongoose.models.Notification as Model<NotificationDocument>) ??
  mongoose.model<NotificationDocument>('Notification', notificationSchema)
