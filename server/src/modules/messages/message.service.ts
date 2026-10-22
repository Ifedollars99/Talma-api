import { AppError } from '../../common/errors/AppError.js'
import { UserModel } from '../users/user.model.js'
import { MessageModel, toMessageDto, type MessageDto } from './message.model.js'
import type { ListMessagesQuery, SendMessageInput } from './message.validation.js'

/** Lists the inbox messages for a user, newest first. */
export async function listMessages(
  userId: string,
  query: ListMessagesQuery,
): Promise<MessageDto[]> {
  const filter: Record<string, unknown> = { recipient: userId }

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(escaped, 'i')
    filter.$or = [{ senderName: pattern }, { subject: pattern }, { preview: pattern }]
  }

  const messages = await MessageModel.find(filter).sort({ createdAt: -1 }).lean()
  return messages.map(toMessageDto)
}

/** Marks a message as read. Only the recipient may do so. */
export async function markAsRead(messageId: string, userId: string): Promise<MessageDto> {
  const message = await MessageModel.findById(messageId)
  if (!message) {
    throw AppError.notFound('Message not found')
  }
  if (String(message.recipient) !== userId) {
    throw AppError.forbidden('You can only read your own messages')
  }

  if (message.unread) {
    message.unread = false
    message.readAt = new Date()
    await message.save()
  }

  return toMessageDto(message.toObject())
}

/** Sends a message to another user (or to every user when no recipient is given). */
export async function sendMessage(
  senderId: string,
  input: SendMessageInput,
): Promise<MessageDto> {
  const sender = await UserModel.findById(senderId).select('username').lean()
  if (!sender) {
    throw AppError.notFound('Account not found')
  }

  const recipients = input.recipient
    ? [input.recipient]
    : (
        await UserModel.find({ _id: { $ne: senderId }, role: 'lecturer' })
          .select('_id')
          .lean()
      ).map((user) => String(user._id))

  if (recipients.length === 0) {
    throw AppError.badRequest('There is nobody to send this message to yet')
  }

  const created = await MessageModel.create(
    recipients.map((recipient) => ({
      sender: senderId,
      senderName: sender.username,
      recipient,
      subject: input.subject,
      preview: input.body.slice(0, 140),
      body: input.body,
      unread: true,
    })),
  )

  return toMessageDto((created[0] as (typeof created)[number]).toObject())
}
