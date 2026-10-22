/**
 * Centralised, typed API client.
 *
 * Responsibilities:
 *  - attach the short-lived access token to every request,
 *  - transparently refresh the session when the access token expires,
 *  - normalise errors into a single `ApiError` shape,
 *  - keep the refresh token in an HttpOnly cookie (never in localStorage).
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }
}

type Listener = (token: string | null) => void

class SessionManager {
  private accessToken: string | null = null
  private listeners = new Set<Listener>()
  private refreshing: Promise<string | null> | null = null

  get token(): string | null {
    return this.accessToken
  }

  set(token: string | null): void {
    this.accessToken = token
    for (const listener of this.listeners) listener(token)
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Refreshes the session once, even when several requests fail at the same time. */
  async refresh(): Promise<string | null> {
    this.refreshing ??= this.performRefresh().finally(() => {
      this.refreshing = null
    })
    return this.refreshing
  }

  private async performRefresh(): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        this.set(null)
        return null
      }
      const data = (await response.json()) as { accessToken?: string }
      if (!data.accessToken) {
        // The API answered "there is no session" — nothing to restore.
        this.set(null)
        return null
      }
      this.set(data.accessToken)
      return data.accessToken
    } catch {
      this.set(null)
      return null
    }
  }
}

export const session = new SessionManager()

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Set to false to skip the automatic refresh-and-retry on a 401. */
  retryOnUnauthorized?: boolean
  /** Send the request as `multipart/form-data` (used for uploads). */
  isFormData?: boolean
}

async function parseError(response: Response): Promise<ApiError> {
  let code = 'REQUEST_FAILED'
  let message = `Request failed with status ${response.status}`
  let details: unknown

  try {
    const data = (await response.json()) as {
      error?: { code?: string; message?: string; details?: unknown }
    }
    if (data.error) {
      code = data.error.code ?? code
      message = data.error.message ?? message
      details = data.error.details
    }
  } catch {
    // The response body was not JSON — keep the generic message.
  }

  return new ApiError(response.status, code, message, details)
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, retryOnUnauthorized = true, isFormData = false, headers, ...rest } = options

  const finalHeaders = new Headers(headers)
  if (!isFormData && body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
  }
  const token = session.token
  if (token) {
    finalHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: 'include',
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  })

  if (response.status === 401 && retryOnUnauthorized && !path.startsWith('/auth/')) {
    const refreshed = await session.refresh()
    if (refreshed) {
      return request<T>(path, { ...options, retryOnUnauthorized: false })
    }
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: formData, isFormData: true }),
}

/** Builds a query string, skipping empty values. */
export function queryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const result = search.toString()
  return result ? `?${result}` : ''
}
