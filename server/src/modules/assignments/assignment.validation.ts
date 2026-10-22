import { z } from 'zod'

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(2, 'Assignment title is required').max(160),
  course: z.string().trim().max(160).default(''),
  dueDate: z.string().trim().max(60).default(''),
  timeLeft: z.string().trim().max(60).default(''),
})

export const assignmentIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid assignment id'),
})

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
