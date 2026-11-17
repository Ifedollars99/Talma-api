import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { Advertisement, AdvertisementKind, HomeContent } from '../types'

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

export interface CreateAdvertisementInput {
  kind: AdvertisementKind
  title: string
  subtitle: string
  description: string
  location: string
  ctaUrl: string
}

/** Any signed-in account can post a school advert or a teaching vacancy. */
export function useCreateAdvertisement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAdvertisementInput) =>
      api.post<{ advertisement: Advertisement }>('/home/advertisements', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeKeys.content })
    },
  })
}
