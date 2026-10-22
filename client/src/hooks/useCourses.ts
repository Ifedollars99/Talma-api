import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { CatalogCountry, Enrollment } from '../types'

export const courseKeys = {
  all: ['courses'] as const,
  catalog: ['courses', 'catalog'] as const,
  enrollments: ['courses', 'enrollments'] as const,
}

/** Loads the university / campus / faculty course catalogue. */
export function useCourseCatalog() {
  return useQuery({
    queryKey: courseKeys.catalog,
    queryFn: () => api.get<{ countries: CatalogCountry[] }>('/courses/catalog'),
    staleTime: 5 * 60 * 1000,
  })
}

/** Loads the courses the signed-in user is enrolled in. */
export function useEnrollments() {
  return useQuery({
    queryKey: courseKeys.enrollments,
    queryFn: () => api.get<{ enrollments: Enrollment[] }>('/courses'),
  })
}

/** Adds a faculty to a campus in the catalogue. */
export function useAddFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { campusId: string; name: string }) =>
      api.post('/courses/catalog/faculties', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: courseKeys.catalog })
    },
  })
}

/** Adds a course to a level in the catalogue. */
export function useAddCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      facultyId: string
      departmentId: string
      levelId: string
      title: string
      lecturer: string
      students: number
      fileName?: string
      pdfUrl?: string
    }) => api.post('/courses/catalog/courses', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: courseKeys.catalog })
    },
  })
}
