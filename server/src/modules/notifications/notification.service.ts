import { AppError } from '../../common/errors/AppError.js'
import {
  NotificationModel,
  toNotificationDto,
  type NotificationDto,
} from './notification.model.js'

export interface NotificationList {
  notifications: NotificationDto[]
  unread: number
}

/** Lists the user's notifications and the unread counter. */
export async function listNotifications(userId: string): Promise<NotificationList> {
  const [notifications, unread] = await Promise.all([
    NotificationModel.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean(),
    NotificationModel.countDocuments({ user: userId, read: false }),
  ])

  return {
    notifications: notifications.map(toNotificationDto),
    unread,
  }
}

/** Marks a single notification as read. */
export async function markAsRead(
  userId: string,
  notificationId: string,
): Promise<NotificationDto> {
  const notification = await NotificationModel.findOne({ _id: notificationId, user: userId })
  if (!notification) {
    throw AppError.notFound('Notification not found')
  }

  if (!notification.read) {
    notification.read = true
    notification.readAt = new Date()
    await notification.save()
  }

  return toNotificationDto(notification.toObject())
}

/** Marks every notification as read. */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await NotificationModel.updateMany(
    { user: userId, read: false },
    { $set: { read: true, readAt: new Date() } },
  )
  return result.modifiedCount
}

/** Creates a notification for a user (used by other modules). */
export async function createNotification(input: {
  user: string
  kind: 'message' | 'assignment' | 'community' | 'post' | 'system'
  title: string
  body?: string
  link?: string
}): Promise<void> {
  await NotificationModel.create({
    user: input.user,
    kind: input.kind,
    title: input.title,
    body: input.body ?? '',
    ...(input.link ? { link: input.link } : {}),
  })
}
