import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export type AssignmentStatus = 'pending' | 'submitted' | 'overdue'

export interface AssignmentDocument {
  title: string
  course: string
  dueDate: string
  timeLeft: string
  status: AssignmentStatus
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type Assignment = HydratedDocument<AssignmentDocument>

const assignmentSchema = new Schema<AssignmentDocument>(
  {
    title: { type: String, required: true },
    course: { type: String, default: '' },
    dueDate: { type: String, default: '' },
    timeLeft: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'overdue'] as const,
      default: 'pending',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false },
)

assignmentSchema.index({ createdAt: -1 })

export interface AssignmentDto {
  id: string
  title: string
  course: string
  dueDate: string
  timeLeft: string
  status: AssignmentStatus
  submitted: boolean
}

export function toAssignmentDto(
  assignment: AssignmentDocument & { _id: mongoose.Types.ObjectId },
  submitted: boolean,
): AssignmentDto {
  return {
    id: String(assignment._id),
    title: assignment.title,
    course: assignment.course,
    dueDate: assignment.dueDate,
    timeLeft: submitted ? 'Submitted' : assignment.timeLeft,
    // The stored status describes the assignment itself; a student's own
    // submission overrides it for display purposes.
    status: submitted ? 'submitted' : assignment.status,
    submitted,
  }
}

export const AssignmentModel: Model<AssignmentDocument> =
  (mongoose.models.Assignment as Model<AssignmentDocument>) ??
  mongoose.model<AssignmentDocument>('Assignment', assignmentSchema)
