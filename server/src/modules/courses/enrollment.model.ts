import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export interface EnrollmentDocument {
  user: mongoose.Types.ObjectId
  title: string
  lecturer: string
  students: number
  lastUpdate: string
  /** Tailwind background class used by the original course cards. */
  color: string
  createdAt: Date
  updatedAt: Date
}

export type Enrollment = HydratedDocument<EnrollmentDocument>

const enrollmentSchema = new Schema<EnrollmentDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    lecturer: { type: String, default: '' },
    students: { type: Number, default: 0 },
    lastUpdate: { type: String, default: 'just now' },
    color: { type: String, default: 'bg-blue-500' },
  },
  { timestamps: true, versionKey: false },
)

enrollmentSchema.index({ user: 1, title: 1 }, { unique: true })

export interface EnrollmentDto {
  id: string
  title: string
  lecturer: string
  students: number
  lastUpdate: string
  color: string
}

export function toEnrollmentDto(enrollment: EnrollmentDocument & { _id: mongoose.Types.ObjectId }): EnrollmentDto {
  return {
    id: String(enrollment._id),
    title: enrollment.title,
    lecturer: enrollment.lecturer,
    students: enrollment.students,
    lastUpdate: enrollment.lastUpdate,
    color: enrollment.color,
  }
}

export const EnrollmentModel: Model<EnrollmentDocument> =
  (mongoose.models.Enrollment as Model<EnrollmentDocument>) ??
  mongoose.model<EnrollmentDocument>('Enrollment', enrollmentSchema)
