import { AppError } from '../../common/errors/AppError.js'
import { questionPool, testFaculties } from '../../data/tests.seed.js'
import { TestAttemptModel } from './testAttempt.model.js'
import type { StartTestInput, SubmitTestInput } from './test.validation.js'

export interface TestQuestionDto {
  id: number
  question: string
  options: string[]
}

/** Returns the faculty / department structure used by the test picker. */
export function listFaculties() {
  return testFaculties
}

/** Picks `count` random questions from the shared pool. */
function pickQuestions(count: number): number[] {
  const pool = [...questionPool]
  // Fisher–Yates shuffle so the selection is unbiased.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = pool[i]
    const b = pool[j]
    if (a && b) {
      pool[i] = b
      pool[j] = a
    }
  }
  return pool.slice(0, Math.min(count, pool.length)).map((question) => question.id)
}

/** Starts a practice test for a department. */
export async function startTest(userId: string, input: StartTestInput) {
  const faculty = testFaculties.find((entry) =>
    entry.departments.some((department) => department.id === input.departmentId),
  )
  if (!faculty) {
    throw AppError.notFound('That department could not be found')
  }

  const department = faculty.departments.find((entry) => entry.id === input.departmentId)
  if (!department) {
    throw AppError.notFound('That department could not be found')
  }

  const questionIds = pickQuestions(input.count)
  const questions: TestQuestionDto[] = questionIds
    .map((id) => questionPool.find((question) => question.id === id))
    .filter((question): question is (typeof questionPool)[number] => question !== undefined)
    .map((question) => ({
      id: question.id,
      question: question.question,
      options: question.options,
    }))

  const attempt = await TestAttemptModel.create({
    user: userId,
    facultyId: faculty.id,
    facultyName: faculty.name,
    departmentId: department.id,
    departmentName: department.name,
    questionIds,
    answers: {},
    total: questions.length,
  })

  return {
    attemptId: String(attempt._id),
    faculty: faculty.name,
    department: department.name,
    questions,
  }
}

/** Scores a submitted attempt. Answers are graded on the server so the correct
 * option is never sent to the browser. */
export async function submitTest(
  userId: string,
  attemptId: string,
  input: SubmitTestInput,
) {
  const attempt = await TestAttemptModel.findOne({ _id: attemptId, user: userId })
  if (!attempt) {
    throw AppError.notFound('Test attempt not found')
  }
  if (attempt.completedAt) {
    throw AppError.badRequest('This test has already been submitted')
  }

  let score = 0
  for (const questionId of attempt.questionIds) {
    const answer = input.answers[String(questionId)]
    const question = questionPool.find((entry) => entry.id === questionId)
    if (question && answer === question.correctIndex) {
      score += 1
    }
  }

  attempt.answers = Object.fromEntries(
    Object.entries(input.answers).map(([key, value]) => [key, Number(value)]),
  )
  attempt.score = score
  attempt.completedAt = new Date()
  await attempt.save()

  return {
    attemptId: String(attempt._id),
    score,
    total: attempt.total,
    faculty: attempt.facultyName,
    department: attempt.departmentName,
  }
}

/** Returns the user's recent test attempts. */
export async function listAttempts(userId: string) {
  const attempts = await TestAttemptModel.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()

  return attempts.map((attempt) => ({
    id: String(attempt._id),
    faculty: attempt.facultyName,
    department: attempt.departmentName,
    score: attempt.score ?? 0,
    total: attempt.total,
    completedAt: attempt.completedAt?.toISOString() ?? null,
    createdAt: attempt.createdAt.toISOString(),
  }))
}
