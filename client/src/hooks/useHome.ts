import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { HomeContent } from '../types'

export const homeKeys = {
  content: ['home', 'content'] as const,
}

/** Verified educators and the school/teaching adverts shown on Home. */
export function useHomeContent(enabled = true) {
  return useQuery({
    queryKey: homeKeys.content,
    queryFn: () => api.get<HomeContent>('/home'),
    enabled,
    staleTime: 60 * 1000,
  })
}
