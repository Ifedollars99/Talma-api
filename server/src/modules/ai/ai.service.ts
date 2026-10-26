import type { Response } from 'express'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { AppError } from '../../common/errors/AppError.js'
import { buildSystemPrompt } from './ai.prompts.js'
import type { ChatInput } from './ai.validation.js'

const UPSTREAM_TIMEOUT_MS = 120_000

type ChatMessage = ChatInput['messages'][number]

interface Provider {
  mode: 'server' | 'free'
  baseUrl: string
  apiKey: string
  model: string
  vision: boolean
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

/**
 * Prefer a real server key. Without one, fall back to the free no-key
 * Pollinations endpoint (rate-limited) so the assistant still works.
 */
function resolveProvider(): Provider | null {
  if (env.aiConfigured) {
    return {
      mode: 'server',
      baseUrl: env.OPENAI_BASE_URL,
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      vision: env.AI_VISION_ENABLED,
    }
  }

  if (env.FREE_AI_ENABLED) {
    return {
      mode: 'free',
      baseUrl: env.FREE_AI_BASE_URL,
      apiKey: '',
      model: env.FREE_AI_MODEL,
      // The anonymous free model only accepts text.
      vision: false,
    }
  }

  return null
}

function upstreamUrl(provider: Provider): string {
  return `${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`
}

function retryAfterSeconds(header: string | null): number {
  if (!header) return 30
  const value = Number(header)
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : 30
}

function providerContent(message: ChatMessage): string | ContentPart[] {
  if (!message.images?.length) return message.content

  const parts: ContentPart[] = [
    {
      type: 'text',
      text:
        message.content ||
        'Describe this picture. Explain what it shows and point out anything useful or important.',
    },
  ]

  for (const image of message.images) {
    parts.push({ type: 'image_url', image_url: { url: image } })
  }

  return parts
}

/**
 * Streams an OpenAI-compatible completion to the browser as server-sent events.
 *
 * The API key never leaves the server. Each event is `data: {"delta":"..."}`
 * and the stream is terminated with `data: [DONE]`.
 */
export async function streamChat(input: ChatInput, res: Response): Promise<void> {
  const provider = resolveProvider()

  if (!provider) {
    throw new AppError(
      503,
      'AI_NOT_CONFIGURED',
      'LINT is not connected yet. Add OPENAI_API_KEY to the server environment.',
    )
  }

  const wantsVision = input.messages.some((message) => (message.images?.length ?? 0) > 0)

  if (wantsVision && !provider.vision) {
    throw new AppError(
      422,
      'VISION_NOT_SUPPORTED',
      provider.mode === 'free'
        ? 'The free AI can only read text. To send pictures, add a free vision-capable key in server/.env — for example a Google Gemini key (Gemini 2.5 Flash) or a Groq key (Llama 4 Scout) — then restart the API.'
        : 'The configured AI model does not accept pictures. Switch OPENAI_MODEL to a vision model such as Gemini 2.5 Flash, GPT-4o or Llama 4 Scout.',
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
  const abortOnClose = () => controller.abort()
  res.on('close', abortOnClose)

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (provider.mode === 'server') {
      headers.Authorization = `Bearer ${provider.apiKey}`
    }

    const upstream = await fetch(upstreamUrl(provider), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.model,
        stream: true,
        temperature: 0.7,
        max_tokens: env.AI_MAX_OUTPUT_TOKENS,
        // The free model is a reasoning model; keep the visible wait short.
        ...(provider.mode === 'free' ? { reasoning_effort: 'low' } : {}),
        messages: [
          { role: 'system', content: buildSystemPrompt(input) },
          ...input.messages.map((message) => ({
            role: message.role,
            content: providerContent(message),
          })),
        ],
      }),
      signal: controller.signal,
    })

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '')
      logger.warn(
        { provider: provider.mode, status: upstream.status, detail: detail.slice(0, 600) },
        'AI upstream request failed',
      )

      if (upstream.status === 402 || upstream.status === 429) {
        const retryAfter = retryAfterSeconds(upstream.headers.get('retry-after'))

        if (provider.mode === 'free') {
          throw new AppError(
            429,
            'FREE_AI_BUSY',
            `The free AI allows one answer every 30 seconds. Try again in ${retryAfter}s.`,
            { retryAfter },
          )
        }

        throw new AppError(
          429,
          'AI_RATE_LIMITED',
          `The AI provider is rate limiting requests. Try again in ${retryAfter}s.`,
          { retryAfter },
        )
      }

      if (upstream.status === 400 && wantsVision) {
        const reason = detail.toLowerCase()
        const looksLikeVisionProblem =
          reason.includes('image') ||
          reason.includes('vision') ||
          reason.includes('multimodal') ||
          reason.includes('media')

        if (looksLikeVisionProblem) {
          throw new AppError(
            422,
            'VISION_NOT_SUPPORTED',
            'The configured AI model rejected the picture. Use a vision-capable model such as Gemini 2.5 Flash, GPT-4o or Llama 4 Scout.',
          )
        }
      }

      if (provider.mode === 'free') {
        throw new AppError(
          502,
          'AI_UPSTREAM_ERROR',
          'The free AI service is unavailable right now. Try again later.',
        )
      }

      if (upstream.status === 401 || upstream.status === 403) {
        throw new AppError(
          502,
          'AI_AUTH_ERROR',
          'The AI provider rejected the API key. Check OPENAI_API_KEY on the server.',
        )
      }

      throw new AppError(
        502,
        'AI_UPSTREAM_ERROR',
        'The AI provider could not answer that request. Please try again.',
      )
    }

    res.status(200)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders?.()

    // A comment line opens the stream immediately through proxies.
    res.write(': connected\n\n')

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const event of events) {
        for (const line of event.split('\n')) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload) continue

          if (payload === '[DONE]') {
            res.write('data: [DONE]\n\n')
            res.end()
            return
          }

          try {
            const parsed = JSON.parse(payload) as {
              choices?: { delta?: { content?: string | null } }[]
            }
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              res.write(`data: ${JSON.stringify({ delta })}\n\n`)
            }
          } catch {
            // Ignore keep-alive or malformed upstream chunks.
          }
        }
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    if (controller.signal.aborted) {
      if (!res.writableEnded) res.end()
      return
    }

    // Headers have already gone out: report the failure inside the stream.
    if (res.headersSent) {
      logger.warn({ err: error }, 'AI stream interrupted')
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            error: 'The AI stream was interrupted. Please try again.',
          })}\n\n`,
        )
        res.end()
      }
      return
    }

    throw error
  } finally {
    clearTimeout(timeout)
    res.off('close', abortOnClose)
  }
}
