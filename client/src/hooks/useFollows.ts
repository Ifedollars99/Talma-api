import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, queryString } from '../lib/apiClient'
import type { FollowListResponse, FollowState, FollowUserSummary } from '../types'
import { profileKeys } from './useProfile'
import { postKeys } from './usePosts'

export const followKeys = {
  all: ['follows'] as const,
  search: (term: string) => ['creator-search', term] as const,
  followers: (username: string) => [...followKeys.all, 'followers', username] as const,
  following: (username: string) => [...followKeys.all, 'following', username] as const,
}

/** Searches public accounts; an empty term returns the verified creators. */
export function useCreatorSearch(term: string, enabled = true) {
  return useQuery({
    queryKey: followKeys.search(term),
    queryFn: () =>
      api.get<{ users: FollowUserSummary[] }>(
        `/users/search${queryString({ q: term.trim() })}`,
      ),
    enabled,
    staleTime: 20 * 1000,
  })
}

export function useFollowers(username: string | undefined, enabled = true) {
  return useQuery({
    queryKey: followKeys.followers(username ?? ''),
    queryFn: () =>
      api.get<FollowListResponse>(`/users/${encodeURIComponent(username as string)}/followers`),
    enabled: Boolean(username) && enabled,
    staleTime: 15 * 1000,
  })
}

export function useFollowing(username: string | undefined, enabled = true) {
  return useQuery({
    queryKey: followKeys.following(username ?? ''),
    queryFn: () =>
      api.get<FollowListResponse>(`/users/${encodeURIComponent(username as string)}/following`),
    enabled: Boolean(username) && enabled,
    staleTime: 15 * 1000,
  })
}

function useRelationshipMutation(method: 'follow' | 'unfollow') {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (username: string) =>
      method === 'follow'
        ? api.post<FollowState>(`/users/${encodeURIComponent(username)}/follow`)
        : api.delete<FollowState>(`/users/${encodeURIComponent(username)}/follow`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.all })
      void queryClient.invalidateQueries({ queryKey: postKeys.all })
      void queryClient.invalidateQueries({ queryKey: followKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['creator-search'] })
    },
  })
}

export function useFollowUser() {
  return useRelationshipMutation('follow')
}

export function useUnfollowUser() {
  return useRelationshipMutation('unfollow')
}
