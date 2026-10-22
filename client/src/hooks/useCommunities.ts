import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, queryString } from '../lib/apiClient'
import type { Community } from '../types'

export const communityKeys = {
  all: ['communities'] as const,
  list: (category: string, search: string) =>
    ['communities', 'list', category, search] as const,
  mine: ['communities', 'mine'] as const,
}

/** Loads the community directory with the caller's membership state. */
export function useCommunities(category = 'All', search = '') {
  return useQuery({
    queryKey: communityKeys.list(category, search),
    queryFn: () => {
      const qs = queryString({ category: category === 'All' ? undefined : category, search })
      return api.get<{ communities: Community[] }>(`/communities${qs}`)
    },
  })
}

/** Loads the communities the user has joined. */
export function useMyCommunities() {
  return useQuery({
    queryKey: communityKeys.mine,
    queryFn: () => api.get<{ communities: Community[] }>('/communities/mine'),
  })
}

/** Creates a community. */
export function useCreateCommunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; desc: string; category: string; school: string }) =>
      api.post<{ community: Community }>('/communities', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: communityKeys.all })
    },
  })
}

/** Joins a community. */
export function useJoinCommunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (communityId: string) =>
      api.post<{ community: Community }>(`/communities/${communityId}/join`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: communityKeys.all })
    },
  })
}

/** Leaves a community. */
export function useLeaveCommunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (communityId: string) =>
      api.post<{ community: Community }>(`/communities/${communityId}/leave`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: communityKeys.all })
    },
  })
}
