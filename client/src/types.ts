/** Shared API types — mirror the JSON the Talma API returns. */

export type UserRole = 'student' | 'lecturer' | 'admin'

export interface User {
  id: string
  email: string
  username: string
  role: UserRole
  emailVerified: boolean
  region: string
  language: string
  timezone: string
  privacyPublic: boolean
  emailNotifications: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  expiresIn: string
}

export type FeedTab = 'foryou' | 'following' | 'discover'

export type PostMediaType = 'none' | 'image' | 'video'

export interface Post {
  id: string
  authorId: string
  author: string
  authorRole: UserRole
  content: string
  subject?: string
  mediaType: PostMediaType
  mediaUrl?: string
  likes: number
  comments: number
  likedByMe: boolean
  timestamp: string
  canDelete: boolean
}

export interface Paginated<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface Enrollment {
  id: string
  title: string
  lecturer: string
  students: number
  lastUpdate: string
  color: string
}

export interface CatalogCourse {
  id: string
  code: string
  title: string
  lecturer: string
  students: number
  lastUpdate: string
  fileName: string
  pdfUrl: string | null
}

export interface CatalogLevel {
  id: string
  label: string
  courses: CatalogCourse[]
}

export interface CatalogDepartment {
  id: string
  name: string
  levels: CatalogLevel[]
}

export interface CatalogFaculty {
  id: string
  name: string
  departments: CatalogDepartment[]
}

export interface CatalogCampus {
  id: string
  name: string
  location: string
  faculties: CatalogFaculty[]
}

export interface CatalogUniversity {
  id: string
  name: string
  fullName: string
  location: string
  campuses: CatalogCampus[]
}

export interface CatalogCountry {
  id: string
  name: string
  flag: string
  universities: CatalogUniversity[]
}

export interface Community {
  id: string
  name: string
  desc: string
  category: string
  school: string
  members: number
  icon: string
  bg: string
  iconColor: string
  lastActive: string
  joined: boolean
  isDirectoryEntry: boolean
}

export interface Message {
  id: string
  sender: string
  subject: string
  preview: string
  body: string
  time: string
  unread: boolean
  createdAt: string
}

export type AssignmentStatus = 'pending' | 'submitted' | 'overdue'

export interface Assignment {
  id: string
  title: string
  course: string
  dueDate: string
  timeLeft: string
  status: AssignmentStatus
  submitted: boolean
}

export type NotificationKind = 'message' | 'assignment' | 'community' | 'post' | 'system'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  link?: string
  read: boolean
  createdAt: string
}

export interface NotificationList {
  notifications: AppNotification[]
  unread: number
}

export interface TestDepartment {
  id: number
  name: string
}

export interface TestFaculty {
  id: number
  name: string
  departments: TestDepartment[]
}

export interface TestQuestion {
  id: number
  question: string
  options: string[]
}

export interface TestStartResult {
  attemptId: string
  faculty: string
  department: string
  questions: TestQuestion[]
}

export interface TestResult {
  attemptId: string
  score: number
  total: number
  faculty: string
  department: string
}

export interface DiscoverHub {
  id: string
  title: string
  desc: string
  icon: string
  bg: string
  iconColor: string
  keywords: string
  route: string
}
