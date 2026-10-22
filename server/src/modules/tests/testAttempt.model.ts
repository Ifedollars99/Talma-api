import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export interface TestAttemptDocument {
  user: mongoose.Types.ObjectId
  facultyId: number
  facultyName: string
  departmentId: number
  departmentName: string
  /** Question ids used for this attempt. */
  questionIds: number[]
  /** The user's answers, keyed by question id. */
  answers: Record<string, number>
  score?: number
  total: number
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type TestAttempt = HydratedDocument<TestAttemptDocument>

const attemptSchema = new Schema<TestAttemptDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    facultyId: { type: Number, required: true },
    facultyName: { type: String, required: true },
    departmentId: { type: Number, required: true },
    departmentName: { type: String, required: true },
    questionIds: { type: [Number], default: [] },
    answers: { type: Schema.Types.Mixed, default: {} },    score: { type: Number },
    total: { type: Number, required: true },
    completedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
)

attemptSchema.index({ user: 1, createdAt: -1 })

export const TestAttemptModel: Model<TestAttemptDocument> =
  (mongoose.models.TestAttempt as Model<TestAttemptDocument>) ??
  mongoose.model<TestAttemptDocument>('TestAttempt', attemptSchema)
