import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type {
  VideoCheckoutResult,
  VideoItem,
  VideoPurchase,
  VideoUploadStart,
  VideoWatchResult,
} from '../types'

export const videoKeys = {
  all: ['videos'] as const,
  mine: ['videos', 'mine'] as const,
  review: ['videos', 'review'] as const,
}

/** True while any entry is still encoding at the provider. */
function hasProcessing(videos: VideoItem[] | undefined): boolean {
  return Boolean(videos?.some((video) => video.status === 'processing'))
}

/** The published video catalogue, with the viewer's purchase state. */
export function useVideos() {
  return useQuery({
    queryKey: videoKeys.all,
    queryFn: () => api.get<{ videos: VideoItem[] }>('/videos'),
    staleTime: 30 * 1000,
    refetchInterval: (query) => (hasProcessing(query.state.data?.videos) ? 5_000 : false),
  })
}

/** A creator's own uploads in every state. */
export function useMyVideos(enabled = true) {
  return useQuery({
    queryKey: videoKeys.mine,
    queryFn: () => api.get<{ videos: VideoItem[] }>('/videos/mine'),
    enabled,
    staleTime: 15 * 1000,
    refetchInterval: (query) => (hasProcessing(query.state.data?.videos) ? 5_000 : false),
  })
}

/** Admin review queue: uploads that finished encoding but are not published. */
export function useReviewQueue(enabled = true) {
  return useQuery({
    queryKey: videoKeys.review,
    queryFn: () => api.get<{ videos: VideoItem[] }>('/videos/review'),
    enabled,
    staleTime: 15 * 1000,
    // Encoding finishes asynchronously; keep the queue fresh while the admin is
    // signed in so a newly processed upload appears without a manual reload.
    refetchInterval: 15_000,
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
  /** Position of this lesson in a series, e.g. `1` for "1 of 4". */
  periodNumber: number
  /** Total lessons in the series, e.g. `4` for "1 of 4". */
  periodTotal: number
  /** What students pay; `0` publishes a free lesson. */
  priceNaira: number
  fileName: string
  mimeType: string
  fileSizeBytes: number
  madeForKids: boolean
}

/**
 * Reserves a direct upload session. New uploads go straight to Cloudflare
 * Stream; the response says which protocol the browser should use.
 */
export function useStartVideoUpload() {
  return useMutation({
    mutationFn: (input: StartVideoUploadInput) =>
      api.post<VideoUploadStart>('/videos/uploads', input),
  })
}

/**
 * Legacy YouTube fallback: sends the creator's file to the API, which forwards
 * it to the YouTube resumable session. New uploads go directly to Cloudflare.
 */
export function useUploadVideoFile() {
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.upload<{ youtubeVideoId: string }>(`/videos/${id}/upload`, formData)
    },
  })
}

/** Finalizes the upload after the provider reports the new video. */
export function useCompleteVideoUpload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string
      youtubeVideoId?: string
      streamUid?: string
    }) => api.post<{ video: VideoItem }>(`/videos/${id}/upload-complete`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoKeys.all })
    },
  })
}

/** Mints a fresh signed playback URL for a Cloudflare or YouTube video. */
export function useWatchVideo() {
  return useMutation({
    mutationFn: (id: string) => api.get<VideoWatchResult>(`/videos/${id}/watch`),
  })
}

/** Admin-only: approve a pending upload and publish it. */
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

/** Admin-only: reject a pending upload and delete the provider copy. */
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
