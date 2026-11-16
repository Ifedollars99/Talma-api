import type { Request, Response } from 'express'
import * as homeService from './home.service.js'

/** GET /api/home — signed-in Home content. */
export async function getHome(_req: Request, res: Response): Promise<void> {
  const content = await homeService.getHomeContent()
  res.json(content)
}
