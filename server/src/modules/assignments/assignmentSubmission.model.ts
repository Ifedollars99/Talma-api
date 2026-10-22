import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'

export interface AssignmentSubmissionDocument {
  assignment: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}

export type AssignmentSubmission = HydratedDocument<AssignmentSubmissionDocument>

const submissionSchema = new Schema<AssignmentSubmissionDocument>(
  {
    assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    submittedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true, versionKey: false },
)

submissionSchema.index({ assignment: 1, user: 1 }, { unique: true })

export const AssignmentSubmissionModel: Model<AssignmentSubmissionDocument> =
  (mongoose.models.AssignmentSubmission as Model<AssignmentSubmissionDocument>) ??
  mongoose.model<AssignmentSubmissionDocument>('AssignmentSubmission', submissionSchema)
