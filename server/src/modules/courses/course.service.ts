import { AppError } from '../../common/errors/AppError.js'
import { universityCatalog } from '../../data/catalog.seed.js'
import type {
  CatalogCountry,
  CatalogCourse,
  CatalogDepartment,
  CatalogFaculty,
  CatalogLevel,
} from '../../data/catalog.seed.js'
import { CourseCatalogModel } from './courseCatalog.model.js'
import { EnrollmentModel, toEnrollmentDto, type EnrollmentDto } from './enrollment.model.js'
import type { AddCourseInput, AddFacultyInput, CreateEnrollmentInput } from './course.validation.js'

/** Maximum number of courses allowed per level (mirrors the original UI limit). */
const MAX_COURSES_PER_LEVEL = 5

/** Returns the catalog, seeding it from the bundled data on first use. */
export async function getCatalog(): Promise<CatalogCountry[]> {
  const existing = await CourseCatalogModel.findOne({ key: 'default' }).lean()
  if (existing) {
    return existing.countries as CatalogCountry[]
  }

  await CourseCatalogModel.create({ key: 'default', countries: universityCatalog })
  return universityCatalog
}

function findCampus(countries: CatalogCountry[], campusId: string) {
  for (const country of countries) {
    for (const university of country.universities) {
      const campus = university.campuses.find((entry) => entry.id === campusId)
      if (campus) return campus
    }
  }
  return null
}

function findFaculty(
  countries: CatalogCountry[],
  facultyId: string,
): { faculty: CatalogFaculty; campusId: string } | null {
  for (const country of countries) {
    for (const university of country.universities) {
      for (const campus of university.campuses) {
        const faculty = campus.faculties.find((entry) => entry.id === facultyId)
        if (faculty) return { faculty, campusId: campus.id }
      }
    }
  }
  return null
}

/** Adds a faculty to a campus and persists the change. */
export async function addFaculty(input: AddFacultyInput): Promise<CatalogFaculty> {
  const catalog = await CourseCatalogModel.findOne({ key: 'default' })
  if (!catalog) {
    throw AppError.notFound('Course catalog has not been initialised')
  }

  const campus = findCampus(catalog.countries as CatalogCountry[], input.campusId)
  if (!campus) {
    throw AppError.notFound('That campus could not be found')
  }

  const faculty: CatalogFaculty = {
    id: `custom-${Date.now()}`,
    name: input.name,
    departments: [],
  }
  campus.faculties.push(faculty)
  await catalog.save()

  return faculty
}

/** Adds a course to a level inside a department and persists the change. */
export async function addCourse(input: AddCourseInput): Promise<CatalogCourse> {
  const catalog = await CourseCatalogModel.findOne({ key: 'default' })
  if (!catalog) {
    throw AppError.notFound('Course catalog has not been initialised')
  }

  const found = findFaculty(catalog.countries as CatalogCountry[], input.facultyId)
  if (!found) {
    throw AppError.notFound('That faculty could not be found')
  }

  const department: CatalogDepartment | undefined = found.faculty.departments.find(
    (entry) => entry.id === input.departmentId,
  )
  if (!department) {
    throw AppError.notFound('That department could not be found')
  }

  const level: CatalogLevel | undefined = department.levels.find(
    (entry) => entry.id === input.levelId,
  )
  if (!level) {
    throw AppError.notFound('That level could not be found')
  }

  if (level.courses.length >= MAX_COURSES_PER_LEVEL) {
    throw AppError.badRequest(`Maximum ${MAX_COURSES_PER_LEVEL} courses per level reached!`)
  }

  const fileName =
    input.fileName ?? `${input.title.toLowerCase().replace(/\s+/g, '-')}.pdf`

  const course: CatalogCourse = {
    id: `custom-${Date.now()}`,
    code: '',
    title: input.title,
    lecturer: input.lecturer,
    students: input.students,
    lastUpdate: 'just now',
    fileName,
    pdfUrl: input.pdfUrl ?? null,
  }

  level.courses.push(course)
  await catalog.save()

  return course
}

/** Lists the courses the user is enrolled in (the "Active courses" panel). */
export async function listEnrollments(userId: string): Promise<EnrollmentDto[]> {
  const enrollments = await EnrollmentModel.find({ user: userId }).sort({ createdAt: 1 }).lean()
  return enrollments.map(toEnrollmentDto)
}

/** Enrols the user in a course. */
export async function createEnrollment(
  userId: string,
  input: CreateEnrollmentInput,
): Promise<EnrollmentDto> {
  const enrollment = await EnrollmentModel.create({
    user: userId,
    title: input.title,
    lecturer: input.lecturer,
    students: input.students,
    lastUpdate: 'just now',
    color: input.color,
  })
  return toEnrollmentDto(enrollment.toObject())
}

/** Removes a course from the user's enrolments. */
export async function deleteEnrollment(userId: string, enrollmentId: string): Promise<void> {
  const result = await EnrollmentModel.deleteOne({ _id: enrollmentId, user: userId })
  if (result.deletedCount === 0) {
    throw AppError.notFound('Course not found')
  }
}
