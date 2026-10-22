import { z } from 'zod'

export const notificationIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid notification id'),
})

export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>
