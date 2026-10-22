import type { Request, Response } from 'express'
import * as messageService from './message.service.js'
import type { ListMessagesQuery, SendMessageInput } from './message.validation.js'

/** GET /api/messages */
export async function list(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListMessagesQuery
  const messages = await messageService.listMessages(req.userId as string, query)
  res.json({ messages })
}

/** POST /api/messages */
export async function send(req: Request, res: Response): Promise<void> {
  const message = await messageService.sendMessage(
    req.userId as string,
    req.body as SendMessageInput,
  )
  res.status(201).json({ message })
}

/** POST /api/messages/:id/read */
export async function markRead(req: Request, res: Response): Promise<void> {
  const message = await messageService.markAsRead(req.params.id as string, req.userId as string)
  res.json({ message })
}
