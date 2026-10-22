import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../common/middleware/auth.js'
import { writeLimiter } from '../../common/middleware/rateLimit.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './course.controller.js'
import { addCourseSchema, addFacultySchema, createEnrollmentSchema } from './course.validation.js'

const enrollmentIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid course id'),
})

export const coursesRouter = Router()

coursesRouter.get('/catalog', controller.catalog)
coursesRouter.post(
  '/catalog/faculties',
  requireAuth,
  writeLimiter,
  validate({ body: addFacultySchema }),
  controller.addFaculty,
)
coursesRouter.post(
  '/catalog/courses',
  requireAuth,
  writeLimiter,
  validate({ body: addCourseSchema }),
  controller.addCourse,
)

coursesRouter.get('/', requireAuth, controller.listEnrollments)
coursesRouter.post(
  '/',
  requireAuth,
  writeLimiter,
  validate({ body: createEnrollmentSchema }),
  controller.createEnrollment,
)
coursesRouter.delete(
  '/:id',
  requireAuth,
  validate({ params: enrollmentIdParamSchema }),
  controller.deleteEnrollment,
)
