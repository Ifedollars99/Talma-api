import type { Request, Response } from 'express'
import * as notificationService from './notification.service.js'

/** GET /api/notifications */
export async function list(req: Request, res: Response): Promise<void> {
  const result = await notificationService.listNotifications(req.userId as string)
  res.json(result)
}

/** POST /api/notifications/:id/read */
export async function markRead(req: Request, res: Response): Promise<void> {
  const notification = await notificationService.markAsRead(
    req.userId as string,
    req.params.id as string,
  )
  res.json({ notification })
}

/** POST /api/notifications/read-all */
export async function markAllRead(req: Request, res: Response): Promise<void> {
  const updated = await notificationService.markAllAsRead(req.userId as string)
  res.json({ updated })
}
