import { Schema, type HydratedDocument, type Model } from 'mongoose'
import mongoose from 'mongoose'
import type { CatalogCountry } from '../../data/catalog.seed.js'

export interface CourseCatalogDocument {
  /** Only one catalog is supported for now; the key keeps the door open for more. */
  key: string
  countries: CatalogCountry[]
  createdAt: Date
  updatedAt: Date
}

export type CourseCatalog = HydratedDocument<CourseCatalogDocument>

const courseSchema = new Schema<unknown>(
  {
    id: { type: String, required: true },
    code: { type: String, default: '' },
    title: { type: String, required: true },
    lecturer: { type: String, default: '' },
    students: { type: Number, default: 0 },
    lastUpdate: { type: String, default: 'just now' },
    fileName: { type: String, default: '' },
    pdfUrl: { type: String, default: null },
  },
  { _id: false },
)

const levelSchema = new Schema<unknown>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    courses: { type: [courseSchema], default: [] },
  },
  { _id: false },
)

const departmentSchema = new Schema<unknown>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    levels: { type: [levelSchema], default: [] },
  },
  { _id: false },
)

const facultySchema = new Schema<unknown>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    departments: { type: [departmentSchema], default: [] },
  },
  { _id: false },
)

const campusSchema = new Schema<unknown>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    location: { type: String, default: '' },
    faculties: { type: [facultySchema], default: [] },
  },
  { _id: false },
)

const universitySchema = new Schema<unknown>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    fullName: { type: String, default: '' },
    location: { type: String, default: '' },
    campuses: { type: [campusSchema], default: [] },
  },
  { _id: false },
)

const countrySchema = new Schema<unknown>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    flag: { type: String, default: '' },
    universities: { type: [universitySchema], default: [] },
  },
  { _id: false },
)

const courseCatalogSchema = new Schema<CourseCatalogDocument>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    countries: { type: [countrySchema], default: [] },
  },
  { timestamps: true, versionKey: false },
)

export const CourseCatalogModel: Model<CourseCatalogDocument> =
  (mongoose.models.CourseCatalog as Model<CourseCatalogDocument>) ??
  mongoose.model<CourseCatalogDocument>('CourseCatalog', courseCatalogSchema)
