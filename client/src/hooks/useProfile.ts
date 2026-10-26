import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { Paginated, Post, PublicProfile } from '../types'

export interface PublicProfileResponse {
  user: PublicProfile
  posts: Post[]
}

export const profileKeys = {
  all: ['profiles'] as const,
  detail: (username: string) => [...profileKeys.all, username] as const,
}

/** Loads a public profile together with everything that person has posted. */
export function usePublicProfile(username: string | undefined) {
  return useQuery({
    queryKey: profileKeys.detail(username ?? ''),
    queryFn: () => api.get<PublicProfileResponse>(`/users/${encodeURIComponent(username as string)}`),
    enabled: Boolean(username),
    staleTime: 30 * 1000,
  })
}

/** Feed shape returned by `/posts` (kept for callers that need it). */
export type { Paginated }
