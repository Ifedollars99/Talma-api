import type { Request, Response } from 'express'
import * as courseService from './course.service.js'
import type { AddCourseInput, AddFacultyInput, CreateEnrollmentInput } from './course.validation.js'

/** GET /api/courses/catalog */
export async function catalog(_req: Request, res: Response): Promise<void> {
  const countries = await courseService.getCatalog()
  res.json({ countries })
}

/** POST /api/courses/catalog/faculties */
export async function addFaculty(req: Request, res: Response): Promise<void> {
  const faculty = await courseService.addFaculty(req.body as AddFacultyInput)
  res.status(201).json({ faculty })
}

/** POST /api/courses/catalog/courses */
export async function addCourse(req: Request, res: Response): Promise<void> {
  const course = await courseService.addCourse(req.body as AddCourseInput)
  res.status(201).json({ course })
}

/** GET /api/courses */
export async function listEnrollments(req: Request, res: Response): Promise<void> {
  const enrollments = await courseService.listEnrollments(req.userId as string)
  res.json({ enrollments })
}

/** POST /api/courses */
export async function createEnrollment(req: Request, res: Response): Promise<void> {
  const enrollment = await courseService.createEnrollment(
    req.userId as string,
    req.body as CreateEnrollmentInput,
  )
  res.status(201).json({ enrollment })
}

/** DELETE /api/courses/:id */
export async function deleteEnrollment(req: Request, res: Response): Promise<void> {
  await courseService.deleteEnrollment(req.userId as string, req.params.id as string)
  res.status(204).send()
}
