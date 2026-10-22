import type { Request, Response } from 'express'
import * as assignmentService from './assignment.service.js'
import type { CreateAssignmentInput } from './assignment.validation.js'

/** GET /api/assignments */
export async function list(req: Request, res: Response): Promise<void> {
  const assignments = await assignmentService.listAssignments(req.userId as string)
  res.json({ assignments })
}

/** POST /api/assignments */
export async function create(req: Request, res: Response): Promise<void> {
  const assignment = await assignmentService.createAssignment(
    req.userId as string,
    req.body as CreateAssignmentInput,
  )
  res.status(201).json({ assignment })
}

/** POST /api/assignments/:id/submit */
export async function submit(req: Request, res: Response): Promise<void> {
  const assignment = await assignmentService.submitAssignment(
    req.userId as string,
    req.params.id as string,
  )
  res.json({ assignment })
}
