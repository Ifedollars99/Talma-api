import type { Request, Response } from 'express'
import * as communityService from './community.service.js'
import type { CreateCommunityInput, ListCommunitiesQuery } from './community.validation.js'

/** GET /api/communities */
export async function list(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListCommunitiesQuery
  const communities = await communityService.listCommunities(req.userId as string, query)
  res.json({ communities })
}

/** GET /api/communities/mine */
export async function mine(req: Request, res: Response): Promise<void> {
  const communities = await communityService.listMyCommunities(req.userId as string)
  res.json({ communities })
}

/** POST /api/communities */
export async function create(req: Request, res: Response): Promise<void> {
  const community = await communityService.createCommunity(
    req.userId as string,
    req.body as CreateCommunityInput,
  )
  res.status(201).json({ community })
}

/** POST /api/communities/:id/join */
export async function join(req: Request, res: Response): Promise<void> {
  const community = await communityService.joinCommunity(
    req.userId as string,
    req.params.id as string,
  )
  res.json({ community })
}

/** POST /api/communities/:id/leave */
export async function leave(req: Request, res: Response): Promise<void> {
  const community = await communityService.leaveCommunity(
    req.userId as string,
    req.params.id as string,
  )
  res.json({ community })
}
