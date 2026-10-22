import type { Request, Response } from 'express'
import { env } from '../../config/env.js'
import * as aiService from './ai.service.js'
import type { ChatInput } from './ai.validation.js'

/** GET /api/ai/status */
export function status(_req: Request, res: Response): void {
  const mode = env.aiMode
  res.json({
    configured: mode !== 'off',
    mode,
    model:
      mode === 'server' ? env.OPENAI_MODEL : mode === 'free' ? env.FREE_AI_MODEL : env.OPENAI_MODEL,
    provider:
      mode === 'server' ? 'OpenAI-compatible' : mode === 'free' ? 'Free AI (Pollinations)' : 'none',
    vision: mode === 'server' ? env.AI_VISION_ENABLED : false,
  })
}

/** POST /api/ai/chat */
export async function chat(req: Request, res: Response): Promise<void> {
  await aiService.streamChat(req.body as ChatInput, res)
}
