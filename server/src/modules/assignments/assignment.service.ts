import { AppError } from '../../common/errors/AppError.js'
import { AssignmentModel, toAssignmentDto, type AssignmentDto } from './assignment.model.js'
import { AssignmentSubmissionModel } from './assignmentSubmission.model.js'
import type { CreateAssignmentInput } from './assignment.validation.js'

/** Lists every assignment, flagged with the caller's submission state. */
export async function listAssignments(userId: string): Promise<AssignmentDto[]> {
  const [assignments, submissions] = await Promise.all([
    AssignmentModel.find().sort({ createdAt: 1 }).lean(),
    AssignmentSubmissionModel.find({ user: userId }).lean(),
  ])

  const submittedIds = new Set(submissions.map((entry) => String(entry.assignment)))

  return assignments.map((assignment) => {
    const submitted = submittedIds.has(String(assignment._id))
    return toAssignmentDto(assignment, submitted)
  })
}

/** Creates an assignment (lecturers and admins only). */
export async function createAssignment(
  createdBy: string,
  input: CreateAssignmentInput,
): Promise<AssignmentDto> {
  const assignment = await AssignmentModel.create({
    title: input.title,
    course: input.course,
    dueDate: input.dueDate,
    timeLeft: input.timeLeft || 'Due soon',
    status: 'pending',
    createdBy,
  })
  return toAssignmentDto(assignment.toObject(), false)
}

/** Records (or re-records) the user's submission of an assignment. */
export async function submitAssignment(
  userId: string,
  assignmentId: string,
): Promise<AssignmentDto> {
  const assignment = await AssignmentModel.findById(assignmentId)
  if (!assignment) {
    throw AppError.notFound('Assignment not found')
  }

  await AssignmentSubmissionModel.updateOne(
    { assignment: assignmentId, user: userId },
    { $set: { submittedAt: new Date() } },
    { upsert: true },
  )

  return toAssignmentDto(assignment.toObject(), true)
}
