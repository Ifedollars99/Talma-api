import type { Request, Response } from 'express'
import * as homeService from './home.service.js'
import type { CreateAdvertisementInput } from './advertisement.validation.js'

/** GET /api/home — signed-in Home content. */
export async function getHome(_req: Request, res: Response): Promise<void> {
  const content = await homeService.getHomeContent()
  res.json(content)
}

/** POST /api/home/advertisements — any signed-in account can post an advert. */
export async function createAdvertisement(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateAdvertisementInput
  const advertisement = await homeService.createAdvertisement(
    req.userId as string,
    req.auth?.username ?? 'Talma user',
    body,
  )
  res.status(201).json({ advertisement })
}
