import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client.
 *
 * Default behaviour: no retries on 4xx (the server already answered
 * definitively), a single retry for network failures, and no refetching of
 * stale data on window focus — the feed updates through explicit mutations.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status
        if (typeof status === 'number' && status >= 400 && status < 500) return false
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
})
