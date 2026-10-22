import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, queryString } from '../lib/apiClient'
import type { Message } from '../types'

export const messageKeys = {
  all: ['messages'] as const,
  list: (search: string) => [...messageKeys.all, 'list', search] as const,
}

/** Loads the inbox. */
export function useMessages(search = '') {
  return useQuery({
    queryKey: messageKeys.list(search),
    queryFn: () => {
      const qs = queryString({ search })
      return api.get<{ messages: Message[] }>(`/messages${qs}`)
    },
  })
}

/** Marks a message as read. */
export function useMarkMessageRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => api.post<{ message: Message }>(`/messages/${messageId}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
