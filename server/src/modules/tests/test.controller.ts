import type { Request, Response } from 'express'
import * as testService from './test.service.js'
import type { StartTestInput, SubmitTestInput } from './test.validation.js'

/** GET /api/tests/faculties */
export async function faculties(_req: Request, res: Response): Promise<void> {
  res.json({ faculties: testService.listFaculties() })
}

/** POST /api/tests/start */
export async function start(req: Request, res: Response): Promise<void> {
  const result = await testService.startTest(req.userId as string, req.body as StartTestInput)
  res.status(201).json(result)
}

/** POST /api/tests/:id/submit */
export async function submit(req: Request, res: Response): Promise<void> {
  const result = await testService.submitTest(
    req.userId as string,
    req.params.id as string,
    req.body as SubmitTestInput,
  )
  res.json(result)
}

/** GET /api/tests/attempts */
export async function attempts(req: Request, res: Response): Promise<void> {
  res.json({ attempts: await testService.listAttempts(req.userId as string) })
}
