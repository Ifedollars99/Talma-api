import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { TestFaculty, TestResult, TestStartResult } from '../types'

export const testKeys = {
  faculties: ['tests', 'faculties'] as const,
}

/** Loads the faculty / department structure used by the test picker. */
export function useTestFaculties() {
  return useQuery({
    queryKey: testKeys.faculties,
    queryFn: () => api.get<{ faculties: TestFaculty[] }>('/tests/faculties'),
    staleTime: 10 * 60 * 1000,
  })
}

/** Starts a practice test for a department. */
export function useStartTest() {
  return useMutation({
    mutationFn: (input: { departmentId: number; count?: number }) =>
      api.post<TestStartResult>('/tests/start', input),
  })
}

/** Submits the answers — the server does the grading. */
export function useSubmitTest() {
  return useMutation({
    mutationFn: (input: { attemptId: string; answers: Record<string, number> }) =>
      api.post<TestResult>(`/tests/${input.attemptId}/submit`, { answers: input.answers }),
  })
}
