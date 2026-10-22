import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

export interface UploadedMedia {
  url: string
  mediaType: 'image' | 'video'
  fileName: string
  size: number
}

/** Uploads an image or video to be attached to a community post. */
export function useUploadPostMedia() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadedMedia> => {
      const formData = new FormData()
      formData.append('file', file)
      return api.upload<UploadedMedia>('/uploads/post-media', formData)
    },
  })
}

export interface UploadedCoursePdf {
  url: string
  fileName: string
  storedName: string
  size: number
}

/** Uploads a course outline PDF. */
export function useUploadCoursePdf() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadedCoursePdf> => {
      const formData = new FormData()
      formData.append('file', file)
      return api.upload<UploadedCoursePdf>('/uploads/course-pdf', formData)
    },
  })
}
