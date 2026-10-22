import { z } from 'zod'

export const addFacultySchema = z.object({
  campusId: z.string().min(1, 'A campus must be selected'),
  name: z.string().trim().min(2, 'Faculty name must be at least 2 characters').max(120),
})

export const addCourseSchema = z.object({
  facultyId: z.string().min(1),
  departmentId: z.string().min(1),
  levelId: z.string().min(1),
  title: z.string().trim().min(2, 'Course title must be at least 2 characters').max(160),
  lecturer: z.string().trim().min(2, 'Lecturer name is required').max(120),
  students: z.coerce.number().int().min(0).max(100_000).default(0),
  fileName: z.string().trim().max(200).optional(),
  pdfUrl: z.string().trim().max(500).optional(),
})

export const createEnrollmentSchema = z.object({
  title: z.string().trim().min(2).max(160),
  lecturer: z.string().trim().max(120).default(''),
  students: z.coerce.number().int().min(0).max(100_000).default(0),
  color: z.string().trim().max(60).default('bg-blue-500'),
})

export type AddFacultyInput = z.infer<typeof addFacultySchema>
export type AddCourseInput = z.infer<typeof addCourseSchema>
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>
