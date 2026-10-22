/**
 * Streaming AI client.
 *
 * Every request goes through the Talma server proxy (`/api/ai/chat`): the API
 * key stays on the server and the request is authenticated with the normal
 * access token. Text deltas arrive as server-sent events.
 */

import { API_BASE_URL, session } from './apiClient'
import type { AssistantMode, StudyLevel } from './studyAssistant'

export type ChatTurn = {
  role: 'user' | 'assistant'
  content: string
  /** Compressed pictures attached to a user message, as data URLs. */
  images?: string[]
}

export interface AssistantStatus {
  configured: boolean
  mode: 'server' | 'free' | 'off'
  model: string
  /** True when the active model can read pictures. */
  vision: boolean
}

export interface StreamAssistantOptions {
  messages: ChatTurn[]
  mode: AssistantMode
  level: StudyLevel
  signal?: AbortSignal
  onDelta: (delta: string) => void
}

export class AiStreamError extends Error {
  readonly code: string | null

  constructor(code: string | null, message: string) {
    super(message)
    this.name = 'AiStreamError'
    this.code = code
  }
}

const FALLBACK_MODEL = 'talma-ai'
const MAX_HISTORY = 30
/** Total base64 image characters sent in one request (the API accepts 16 MB). */
const MAX_IMAGE_CHARS = 10_000_000

function trimHistory(messages: ChatTurn[]): ChatTurn[] {
  const kept = messages
    .filter((message) => message.content.trim().length > 0 || (message.images?.length ?? 0) > 0)
    .slice(-MAX_HISTORY)
    .map((message) => ({
      role: message.role,
      content: message.content,
      ...(message.images?.length ? { images: message.images } : {}),
    }))

  // Walk backwards so the newest pictures always fit; drop older ones once
  // the request would get too large.
  let remaining = MAX_IMAGE_CHARS
  for (let index = kept.length - 1; index >= 0; index -= 1) {
    const message = kept[index]
    if (!message?.images?.length) continue

    const images: string[] = []
    for (const image of message.images) {
      if (image.length <= remaining) {
        images.push(image)
        remaining -= image.length
      }
    }

    kept[index] = {
      role: message.role,
      content: message.content,
      ...(images.length > 0 ? { images } : {}),
    }
  }

  return kept
}

async function fetchWithSession(
  path: string,
  init: RequestInit,
  retry = true,
): Promise<Response> {
  let token = session.token
  if (!token) token = await session.refresh()

  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && retry) {
    const refreshed = await session.refresh()
    if (refreshed) {
      headers.set('Authorization', `Bearer ${refreshed}`)
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers,
        credentials: 'include',
      })
    }
  }

  return response
}

function parseErrorPayload(raw: string): { code: string | null; message: string | null } {
  try {
    const parsed = JSON.parse(raw) as {
      error?: { code?: string; message?: string }
    }
    return {
      code: parsed.error?.code ?? null,
      message: parsed.error?.message ?? null,
    }
  } catch {
    return { code: null, message: null }
  }
}

async function streamFromServer(options: StreamAssistantOptions): Promise<void> {
  const response = await fetchWithSession('/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: trimHistory(options.messages),
      mode: options.mode,
      level: options.level,
    }),
    signal: options.signal,
  })

  if (!response.ok) {
    const payload = parseErrorPayload(await response.text().catch(() => ''))
    throw new AiStreamError(
      payload.code,
      payload.message ?? `The assistant could not answer (${response.status}).`,
    )
  }

  await consumeStream(response, options.onDelta)
}

/** Streams an answer through the authenticated server proxy. */
export async function streamAssistant(options: StreamAssistantOptions): Promise<void> {
  await streamFromServer(options)
}

/** Reads a server-sent event stream and forwards text deltas. */
async function consumeStream(response: Response, onDelta: (delta: string) => void): Promise<void> {
  if (!response.body) {
    throw new AiStreamError(null, 'The assistant returned an empty response.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const event of events) {
        for (const line of event.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue

          const payload = trimmed.slice(5).trim()
          if (!payload) continue
          if (payload === '[DONE]') return

          try {
            const parsed = JSON.parse(payload) as {
              delta?: string
              error?: string
              choices?: { delta?: { content?: string | null } }[]
            }

            if (parsed.error) {
              throw new AiStreamError(null, parsed.error)
            }

            const delta = parsed.delta ?? parsed.choices?.[0]?.delta?.content
            if (delta) onDelta(delta)
          } catch (error) {
            if (error instanceof AiStreamError) throw error
            // Ignore keep-alive or malformed chunks.
          }
        }
      }
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined)
    throw error
  }
}

/** Reports whether the server has an AI key and which model it uses. */
export async function getAssistantStatus(): Promise<AssistantStatus> {
  try {
    const response = await fetchWithSession('/ai/status', { method: 'GET' })
    if (!response.ok) return { configured: false, mode: 'off', model: FALLBACK_MODEL, vision: false }

    const data = (await response.json()) as {
      configured?: boolean
      mode?: string
      model?: string
      vision?: boolean
    }

    const mode: AssistantStatus['mode'] =
      data.mode === 'server' || data.mode === 'free'
        ? data.mode
        : data.configured === true
          ? 'server'
          : 'off'

    return {
      configured: mode !== 'off',
      mode,
      model: typeof data.model === 'string' && data.model ? data.model : FALLBACK_MODEL,
      vision: mode === 'server' && data.vision === true,
    }
  } catch {
    return { configured: false, mode: 'off', model: FALLBACK_MODEL, vision: false }
  }
}
