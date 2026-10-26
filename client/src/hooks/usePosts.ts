import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, queryString } from '../lib/apiClient'
import type { FeedTab, Paginated, Post } from '../types'

export const postKeys = {
  all: ['posts'] as const,
  feed: (tab: FeedTab, search: string) => [...postKeys.all, 'feed', tab, search] as const,
}

export interface FeedParams {
  tab?: FeedTab
  search?: string
  page?: number
  limit?: number
}

/** Loads a page of posts for the requested feed tab. */
export function useFeed({ tab = 'foryou', search = '', page = 1, limit = 20 }: FeedParams = {}) {
  return useQuery({
    queryKey: postKeys.feed(tab, search),
    queryFn: async () => {
      const qs = queryString({ feed: tab, search, page, limit })
      return api.get<Paginated<Post>>(`/posts${qs}`)
    },
  })
}

/** Creates a new community post. */
export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      content: string
      subject?: string
      classLevel?: string
      mediaType?: 'none' | 'image' | 'video'
      mediaUrl?: string
    }) => api.post<{ post: Post }>('/posts', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: postKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

/** Likes or unlikes a post. */
export function useToggleLike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked
        ? api.delete<{ post: Post }>(`/posts/${postId}/like`)
        : api.post<{ post: Post }>(`/posts/${postId}/like`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: postKeys.all })
      // Public profile pages cache the same posts under a separate key.
      void queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

/** Deletes a post (the API enforces ownership). */
export function useDeletePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) => api.delete<void>(`/posts/${postId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: postKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}
