import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { Assignment } from '../types'

export const assignmentKeys = {
  all: ['assignments'] as const,
}

/** Loads the assignment list with the caller's submission state. */
export function useAssignments() {
  return useQuery({
    queryKey: assignmentKeys.all,
    queryFn: () => api.get<{ assignments: Assignment[] }>('/assignments'),
  })
}

/** Records the user's submission of an assignment. */
export function useSubmitAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) =>
      api.post<{ assignment: Assignment }>(`/assignments/${assignmentId}/submit`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.all })
    },
  })
}

/** Creates an assignment (lecturers and admins only — the API enforces it). */
export function useCreateAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; course: string; dueDate: string; timeLeft?: string }) =>
      api.post<{ assignment: Assignment }>('/assignments', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.all })
    },
  })
}
