import { z } from 'zod'

export const startTestSchema = z.object({
  departmentId: z.coerce.number().int().positive(),
  count: z.coerce.number().int().min(1).max(30).default(10),
})

export const submitTestSchema = z.object({
  answers: z.record(z.coerce.number().int().min(0)),
})

export const attemptIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid attempt id'),
})

export type StartTestInput = z.infer<typeof startTestSchema>
export type SubmitTestInput = z.infer<typeof submitTestSchema>
