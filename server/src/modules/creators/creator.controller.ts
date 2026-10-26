import type { Request, Response } from 'express'
import * as creatorService from './creator.service.js'
import type {
  ApplyCreatorInput,
  RejectCreatorInput,
} from './creator.validation.js'

/** GET /api/creators/me */
export async function me(req: Request, res: Response): Promise<void> {
  const creator = await creatorService.getMyCreatorProfile(req.userId as string)
  res.json({ creator })
}

/** GET /api/creators/banks */
export async function banks(_req: Request, res: Response): Promise<void> {
  const banks = await creatorService.getBanks()
  res.json({ banks })
}

/** POST /api/creators/apply */
export async function apply(req: Request, res: Response): Promise<void> {
  const creator = await creatorService.applyAsCreator(
    req.userId as string,
    req.body as ApplyCreatorInput,
  )
  res.status(201).json({ creator })
}

/** POST /api/creators/verify/request — emails a six-digit code. */
export async function requestVerification(req: Request, res: Response): Promise<void> {
  const result = await creatorService.requestCreatorVerification(req.userId as string)
  res.json({
    message: 'We sent a six-digit code to your email address.',
    ...result,
  })
}

/** POST /api/creators/verify/confirm — upgrades the account to a creator. */
export async function confirmVerification(req: Request, res: Response): Promise<void> {
  const { code } = req.body as { code: string }
  const result = await creatorService.confirmCreatorVerification(req.userId as string, code)
  res.json(result)
}

/** GET /api/creators?status=pending — admin only. */
export async function list(req: Request, res: Response): Promise<void> {
  const status = req.query.status as
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | undefined
  const creators = await creatorService.listCreatorApplications(status)
  res.json({ creators })
}

/** POST /api/creators/:id/approve — admin only. */
export async function approve(req: Request, res: Response): Promise<void> {
  const creator = await creatorService.approveCreator(
    req.params.id as string,
    req.userId as string,
  )
  res.json({ creator })
}

/** POST /api/creators/:id/reject — admin only. */
export async function reject(req: Request, res: Response): Promise<void> {
  const { reason } = req.body as RejectCreatorInput
  const creator = await creatorService.rejectCreator(
    req.params.id as string,
    req.userId as string,
    reason,
  )
  res.json({ creator })
}
