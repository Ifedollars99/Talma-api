/** Shared API types — mirror the JSON the Talma API returns. */

export type UserRole = 'user' | 'creator' | 'student' | 'lecturer' | 'admin'
export type CreatorStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'suspended'
export type Gender = 'male' | 'female'

export interface User {
  id: string
  email: string
  username: string
  role: UserRole
  creatorStatus: CreatorStatus
  emailVerified: boolean
  region: string
  state: string
  language: string
  timezone: string
  bio: string
  avatarUrl: string
  gender?: Gender
  creatorVerifiedAt?: string
  privacyPublic: boolean
  emailNotifications: boolean
  createdAt: string
  lastLoginAt?: string
}

/** What anyone can see on a public creator profile. */
export interface PublicProfile {
  id: string
  username: string
  role: UserRole
  creatorStatus: CreatorStatus
  region: string
  state: string
  bio: string
  avatarUrl: string
  gender?: Gender
  creatorVerifiedAt?: string
  createdAt: string
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

/** Compact account card returned by search and follower/following lists. */
export interface FollowUserSummary {
  id: string
  username: string
  role: UserRole
  creatorStatus: CreatorStatus
  region: string
  state: string
  bio: string
  avatarUrl: string
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

export interface FollowListResponse {
  users: FollowUserSummary[]
}

export interface FollowState {
  following: boolean
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

export interface AuthResponse {
  user: User
  accessToken: string
  expiresIn: string
}

export type FeedTab = 'foryou' | 'following'

export type PostMediaType = 'none' | 'image' | 'video'

export interface Post {
  id: string
  authorId: string
  author: string
  authorUsername?: string
  authorAvatarUrl?: string
  authorRole: UserRole
  content: string
  subject?: string
  classLevel?: string
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

export type VideoStatus =
  | 'draft'
  | 'uploading'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'failed'

export interface VideoItem {
  id: string
  title: string
  description: string
  subject: string
  classLevel: string
  thumbnailUrl: string
  durationSeconds: number
  priceKobo: number
  currency: string
  purchased: boolean
  locked: boolean
  published: boolean
  status: VideoStatus
  createdAt: string
  canManage: boolean
  canReview: boolean
  creator?: { id: string; name: string }
  rejectionReason?: string
  uploadedAt?: string
  /** Present only after purchase (or for administrators/owners). */
  watchUrl?: string
  /** Present only for administrators. */
  youtubeUrl?: string
  studioUrl?: string
}

export interface VideoUploadStart {
  video: VideoItem
  /** One-time Google resumable upload session. */
  uploadUrl: string
  uploadExpiresAt: string
}

export type VideoPaymentStatus = 'pending' | 'paid' | 'failed' | 'abandoned'

export interface VideoPurchase {
  id: string
  videoId: string
  reference: string
  amountKobo: number
  currency: string
  status: VideoPaymentStatus
  creatorShareKobo?: number
  platformShareKobo?: number
  paidAt?: string
  createdAt: string
}

export interface VideoCheckoutResult {
  alreadyPurchased: boolean
  amountKobo: number
  currency: string
  authorizationUrl?: string
  accessCode?: string
  reference?: string
  watchUrl?: string
}

export interface CreatorProfile {
  id: string
  userId: string
  username: string
  email: string
  displayName: string
  bio: string
  status: Exclude<CreatorStatus, 'none'>
  bankName: string
  accountNumber: string
  accountName: string
  sharePercent: number
  platformSharePercent: number
  paystackSubaccountCode?: string
  appliedAt: string
  reviewedAt?: string
  rejectionReason?: string
}

export interface CreatorBank {
  name: string
  code: string
  slug?: string
  country?: string
  currency?: string
  type?: string
}

export interface CreatorVerificationRequest {
  message: string
  email: string
  delivered: boolean
  /** Only returned outside production so local testing does not need a mail provider. */
  devCode?: string
  /** Ethereal only: a development inbox preview of the sent email. */
  previewUrl?: string
}

export interface CreatorVerificationResult {
  user: User
  message: string
}
