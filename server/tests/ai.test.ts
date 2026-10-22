import { afterEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { app, registerUser } from './helpers.js'

/** Builds an upstream SSE response with the given raw chunks. */
function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

function sseContent(text: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`
}

const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo='

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Study Assistant', () => {
  it('requires authentication for the status endpoint', async () => {
    await request(app).get('/api/ai/status').expect(401)
  })

  it('reports the free provider when no server key is configured', async () => {
    const { accessToken } = await registerUser()

    const response = await request(app)
      .get('/api/ai/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(response.body).toMatchObject({
      configured: true,
      mode: 'free',
      model: 'openai-fast',
      vision: false,
    })
  })

  it('requires authentication to chat', async () => {
    await request(app)
      .post('/api/ai/chat')
      .send({ messages: [{ role: 'user', content: 'Hello' }] })
      .expect(401)
  })

  it('validates the conversation payload', async () => {
    const { accessToken } = await registerUser()

    const response = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ messages: [] })
      .expect(422)

    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects pictures attached to an assistant message', async () => {
    const { accessToken } = await registerUser()

    const response = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        messages: [{ role: 'assistant', content: 'Look at this', images: [PNG_DATA_URL] }],
      })
      .expect(422)

    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('refuses pictures on the text-only free provider', async () => {
    const { accessToken } = await registerUser()
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)

    const response = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ messages: [{ role: 'user', content: 'Describe this', images: [PNG_DATA_URL] }] })
      .expect(422)

    expect(response.body.error.code).toBe('VISION_NOT_SUPPORTED')
    expect(upstream).not.toHaveBeenCalled()
  })

  it('streams deltas from upstream without leaking a key', async () => {
    const { accessToken } = await registerUser()

    const upstream = vi.fn(async (_url: string, _init: RequestInit) =>
      streamResponse([
        sseContent('Hello'),
        ': keep-alive\n\n',
        sseContent(' there'),
        'data: [DONE]\n\n',
      ]),
    )
    vi.stubGlobal('fetch', upstream)

    const response = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        messages: [{ role: 'user', content: 'Say hello' }],
        mode: 'study',
        level: 'secondary',
      })
      .expect(200)

    expect(response.text).toContain('data: {"delta":"Hello"}')
    expect(response.text).toContain('data: {"delta":" there"}')
    expect(response.text).toContain('data: [DONE]')

    const [url, init] = upstream.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://text.pollinations.ai/v1/chat/completions')

    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()

    const body = JSON.parse(String(init.body)) as {
      model: string
      stream: boolean
      messages: { role: string; content: string }[]
    }
    expect(body.model).toBe('openai-fast')
    expect(body.stream).toBe(true)
    expect(body.messages[0]?.role).toBe('system')
    expect(body.messages[0]?.content).toContain('secondary school')
    expect(body.messages.at(-1)).toEqual({ role: 'user', content: 'Say hello' })
  })

  it('surfaces the free provider rate limit', async () => {
    const { accessToken } = await registerUser()

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('slow down', { status: 429, headers: { 'retry-after': '12' } })),
    )

    const response = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ messages: [{ role: 'user', content: 'Hello' }] })
      .expect(429)

    expect(response.body.error.code).toBe('FREE_AI_BUSY')
    expect(response.body.error.details).toEqual({ retryAfter: 12 })
  })

  it('reports an upstream failure without crashing', async () => {
    const { accessToken } = await registerUser()

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('upstream exploded', { status: 500 })),
    )

    const response = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ messages: [{ role: 'user', content: 'Hello' }] })
      .expect(502)

    expect(response.body.error.code).toBe('AI_UPSTREAM_ERROR')
  })
})
