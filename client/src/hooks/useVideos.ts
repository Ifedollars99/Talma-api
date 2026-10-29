import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type {
  VideoCheckoutResult,
  VideoItem,
  VideoPurchase,
  VideoUploadStart,
} from '../types'

export const videoKeys = {
  all: ['videos'] as const,
  mine: ['videos', 'mine'] as const,
  review: ['videos', 'review'] as const,
}

/** The published video catalogue, with the viewer's purchase state. */
export function useVideos() {
  return useQuery({
    queryKey: videoKeys.all,
    queryFn: () => api.get<{ videos: VideoItem[] }>('/videos'),
    staleTime: 30 * 1000,
  })
}

/** A creator's own uploads in every state. */
export function useMyVideos(enabled = true) {
  return useQuery({
    queryKey: videoKeys.mine,
    queryFn: () => api.get<{ videos: VideoItem[] }>('/videos/mine'),
    enabled,
    staleTime: 15 * 1000,
  })
}

/** Admin review queue: uploads that finished on YouTube but are still private. */
export function useReviewQueue(enabled = true) {
  return useQuery({
    queryKey: videoKeys.review,
    queryFn: () => api.get<{ videos: VideoItem[] }>('/videos/review'),
    enabled,
    staleTime: 15 * 1000,
  })
}

export interface CreateVideoInput {
  youtubeUrl: string
  title: string
  description?: string
  subject: string
  classLevel: string
  durationSeconds?: number
  priceNaira?: number
  published?: boolean
}

/** Admin-only: add a video by pasting its YouTube link. */
export function useCreateVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVideoInput) => api.post<{ video: VideoItem }>('/videos', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoKeys.all })
    },
  })
}

/** Admin-only: update metadata, price or visibility. */
export function useUpdateVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateVideoInput> }) =>
      api.patch<{ video: VideoItem }>(`/videos/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoKeys.all })
    },
  })
}

/** Administrators can remove any video; creators only their own unsold work. */
export function useDeleteVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/videos/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoKeys.all })
    },
  })
}

/** Creates a Paystack checkout and returns the URL to redirect the buyer to. */
export function useCheckoutVideo() {
  return useMutation({
    mutationFn: (videoId: string) =>
      api.post<VideoCheckoutResult>(`/videos/${videoId}/checkout`),
  })
}

/** Confirms a payment when Paystack sends the buyer back to Talma. */
export function useVerifyVideoPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reference: string) =>
      api.post<{ purchase: VideoPurchase; video: VideoItem }>('/videos/purchases/verify', {
        reference,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoKeys.all })
    },
  })
}

export interface StartVideoUploadInput {
  title: string
  description: string
  subject: string
  classLevel: string
  /** What students pay; `0` publishes a free lesson. */
  priceNaira: number
  fileName: string
  mimeType: string
  fileSizeBytes: number
  madeForKids: boolean
}

/**
 * Reserves a YouTube resumable upload session. The returned `uploadUrl` is
 * used by the browser to send the file straight to Google.
 */
export function useStartVideoUpload() {
  return useMutation({
    mutationFn: (input: StartVideoUploadInput) =>
      api.post<VideoUploadStart>('/videos/uploads', input),
  })
}

/** Finalizes the upload after Google returns the new video id. */
export function useCompleteVideoUpload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, youtubeVideoId }: { id: string; youtubeVideoId: string }) =>
      api.post<{ video: VideoItem }>(`/videos/${id}/upload-complete`, { youtubeVideoId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoKeys.all })
    },
  })
}

/** Admin-only: approve a pending upload and make it unlisted on YouTube. */
export function useApproveVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, priceNaira }: { id: string; priceNaira?: number }) =>
      api.post<{ video: VideoItem }>(`/videos/${id}/approve`, { priceNaira }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoKeys.all })
    },
  })
}

/** Admin-only: reject a pending upload and delete the YouTube copy. */
export function useRejectVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<{ video: VideoItem }>(`/videos/${id}/reject`, { reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoKeys.all })
    },
  })
}
