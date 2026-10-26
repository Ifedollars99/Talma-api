import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type {
  CreatorBank,
  CreatorProfile,
  CreatorVerificationRequest,
  CreatorVerificationResult,
} from '../types'

export const creatorKeys = {
  all: ['creators'] as const,
  me: ['creators', 'me'] as const,
  banks: ['creators', 'banks'] as const,
  list: (status?: string) => ['creators', 'list', status ?? 'all'] as const,
}

/** Emails a six-digit code that verifies the signed-in user as a creator. */
export function useRequestCreatorVerification() {
  return useMutation({
    mutationFn: () =>
      api.post<CreatorVerificationRequest>('/creators/verify/request'),
  })
}

/** Confirms the emailed code and upgrades the account to a creator. */
export function useConfirmCreatorVerification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) =>
      api.post<CreatorVerificationResult>('/creators/verify/confirm', { code }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorKeys.all })
    },
  })
}

/** The signed-in user's creator application/payout profile, if any. */
export function useCreatorProfile(enabled = true) {
  return useQuery({
    queryKey: creatorKeys.me,
    queryFn: () => api.get<{ creator: CreatorProfile | null }>('/creators/me'),
    enabled,
    staleTime: 30 * 1000,
  })
}

export function useCreatorBanks(enabled = true) {
  return useQuery({
    queryKey: creatorKeys.banks,
    queryFn: () => api.get<{ banks: CreatorBank[] }>('/creators/banks'),
    enabled,
    staleTime: 60 * 60 * 1000,
  })
}

export interface ApplyCreatorInput {
  displayName: string
  bio: string
  bankCode: string
  accountNumber: string
}

export function useApplyCreator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ApplyCreatorInput) =>
      api.post<{ creator: CreatorProfile }>('/creators/apply', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorKeys.all })
    },
  })
}

export function useCreatorApplications(status: string | undefined, enabled = true) {
  return useQuery({
    queryKey: creatorKeys.list(status),
    queryFn: () => {
      const query = status ? `?status=${encodeURIComponent(status)}` : ''
      return api.get<{ creators: CreatorProfile[] }>(`/creators${query}`)
    },
    enabled,
    staleTime: 15 * 1000,
  })
}

export function useApproveCreator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ creator: CreatorProfile }>(`/creators/${id}/approve`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorKeys.all })
    },
  })
}

export function useRejectCreator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<{ creator: CreatorProfile }>(`/creators/${id}/reject`, { reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorKeys.all })
    },
  })
}
