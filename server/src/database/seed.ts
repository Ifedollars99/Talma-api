/**
 * Seeds the local development database with the shared catalogue, the community
 * directory and a small set of fictional student accounts so the app has
 * something to show on a fresh install.
 *
 *   npm run seed            # seed only if the database is empty
 *   npm run seed -- --force # wipe the app collections and re-seed
 */
import mongoose from 'mongoose'
import { connectDatabase, disconnectDatabase } from './connect.js'
import { logger } from '../config/logger.js'
import { hashPassword } from '../common/utils/password.js'
import { universityCatalog } from '../data/catalog.seed.js'
import { communityDirectory } from '../data/communities.seed.js'
import { UserModel } from '../modules/users/user.model.js'
import { CourseCatalogModel } from '../modules/courses/courseCatalog.model.js'
import { EnrollmentModel } from '../modules/courses/enrollment.model.js'
import { CommunityModel } from '../modules/communities/community.model.js'
import { CommunityMembershipModel } from '../modules/communities/communityMembership.model.js'
import { MessageModel } from '../modules/messages/message.model.js'
import { AssignmentModel } from '../modules/assignments/assignment.model.js'
import { AssignmentSubmissionModel } from '../modules/assignments/assignmentSubmission.model.js'
import { NotificationModel } from '../modules/notifications/notification.model.js'
import { PostModel } from '../modules/posts/post.model.js'
import { ReactionModel } from '../modules/posts/reaction.model.js'
import { RefreshSessionModel } from '../modules/auth/refreshSession.model.js'
import { TestAttemptModel } from '../modules/tests/testAttempt.model.js'

const force = process.argv.includes('--force')

const DEMO_PASSWORD = 'TalmaDemo123'

const demoUsers = [
  {
    username: 'AishaBello',
    email: 'aisha.bello@example.com',
    role: 'student' as const,
    region: 'Nigeria',
  },
  {
    username: 'TundeAdeyemi',
    email: 'tunde.adeyemi@example.com',
    role: 'student' as const,
    region: 'Nigeria',
  },
  {
    username: 'DrSarahOkonkwo',
    email: 'sarah.okonkwo@example.com',
    role: 'lecturer' as const,
    region: 'Nigeria',
  },
]

const demoEnrollments = [
  {
    title: 'Advanced Mathematics',
    lecturer: 'Dr. Sarah Okonkwo',
    students: 45,
    lastUpdate: '2 days ago',
    color: 'bg-blue-500',
  },
  {
    title: 'Physics Science',
    lecturer: 'Prof. Michael Chen',
    students: 38,
    lastUpdate: '1 day ago',
    color: 'bg-green-500',
  },
  {
    title: 'Computer Science',
    lecturer: 'Dr. Sarah Okonkwo',
    students: 52,
    lastUpdate: '3 hours ago',
    color: 'bg-purple-500',
  },
  {
    title: 'Chemistry Basics',
    lecturer: 'Prof. David Kim',
    students: 41,
    lastUpdate: '5 days ago',
    color: 'bg-red-500',
  },
]

const demoAssignments = [
  {
    title: 'Calculus Problem Set 3',
    course: 'CMP 448 - Distributed Systems',
    dueDate: 'Sept 25, 2026',
    timeLeft: '2 days left',
    status: 'pending' as const,
  },
  {
    title: 'Lab Report: Motion Analysis',
    course: 'CMP 411 - Computer Networks',
    dueDate: 'Sept 27, 2026',
    timeLeft: '4 days left',
    status: 'pending' as const,
  },
  {
    title: 'Algorithm Implementation',
    course: 'CMP 405 - Algorithms and Complexity',
    dueDate: 'Sept 22, 2026',
    timeLeft: 'Overdue',
    status: 'overdue' as const,
  },
  {
    title: 'Chemical Equations Quiz',
    course: 'CMP 422 - Database Management Systems',
    dueDate: 'Sept 20, 2026',
    timeLeft: 'Submitted',
    status: 'submitted' as const,
  },
]

const demoPosts = [
  {
    authorName: 'Dr. Sarah Okonkwo',
    authorRole: 'lecturer' as const,
    content:
      "Understanding calculus limits can be challenging. Here's a visual representation that might help!",
    mediaType: 'none' as const,
    subject: 'Advanced Mathematics',
    likes: 12,
  },
  {
    authorName: 'Prof. Adewole Olamilekan',
    authorRole: 'lecturer' as const,
    content:
      "Understanding data structures is crucial for programming. Here's a comprehensive guide to arrays and linked lists.",
    mediaType: 'none' as const,
    subject: 'Computer Science',
    likes: 8,
  },
  {
    authorName: 'Tunde Adeyemi',
    authorRole: 'student' as const,
    content:
      'Created this flowchart to understand sorting algorithms better. Hope it helps others too!',
    mediaType: 'none' as const,
    subject: 'Computer Science',
    likes: 15,
  },
]

const demoMessages = [
  {
    senderName: 'Dr. Sarah Okonkwo',
    subject: 'Mathematics Assignment Due',
    preview: 'Please submit your calculus assignment by Friday...',
    body: 'Please submit your calculus assignment by Friday. Late submissions attract a 10% penalty, and the mark counts towards your continuous assessment for CMP 448.',
  },
  {
    senderName: 'Physics Study Group',
    subject: 'Study Session Tomorrow',
    preview: "We're meeting at the library at 3PM...",
    body: "We're meeting at the library at 3PM to work through the rotation problems. Bring your notes and the past question sheet.",
  },
  {
    senderName: 'Prof. Michael Chen',
    subject: 'Lab Report Feedback',
    preview: 'Great work on your recent lab report...',
    body: 'Great work on your recent lab report. Your error analysis section was much stronger this time — keep it up.',
  },
]

async function clearCollections(): Promise<void> {
  await Promise.all([
    UserModel.deleteMany({}),
    CourseCatalogModel.deleteMany({}),
    EnrollmentModel.deleteMany({}),
    CommunityModel.deleteMany({}),
    CommunityMembershipModel.deleteMany({}),
    MessageModel.deleteMany({}),
    AssignmentModel.deleteMany({}),
    AssignmentSubmissionModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    PostModel.deleteMany({}),
    ReactionModel.deleteMany({}),
    RefreshSessionModel.deleteMany({}),
    TestAttemptModel.deleteMany({}),
  ])
  logger.warn('Cleared all Talma collections (--force)')
}

async function seed(): Promise<void> {
  await connectDatabase()

  if (force) {
    await clearCollections()
  }

  // ---- Course catalogue -------------------------------------------------
  const catalog = await CourseCatalogModel.findOne({ key: 'default' })
  if (!catalog) {
    await CourseCatalogModel.create({ key: 'default', countries: universityCatalog })
    logger.info('Seeded the course catalogue')
  }

  // ---- Community directory ----------------------------------------------
  for (const entry of communityDirectory) {
    await CommunityModel.updateOne(
      { directoryKey: entry.key },
      {
        $setOnInsert: {
          name: entry.name,
          desc: entry.desc,
          category: entry.category,
          school: entry.school,
          members: entry.members,
          icon: entry.icon,
          bg: entry.bg,
          iconColor: entry.iconColor,
          lastActive: entry.lastActive,
          isDirectoryEntry: true,
        },
      },
      { upsert: true },
    )
  }

  // ---- Users -------------------------------------------------------------
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const users = []
  for (const demo of demoUsers) {
    const existing = await UserModel.findOne({ email: demo.email })
    if (existing) {
      users.push(existing)
      continue
    }
    users.push(
      await UserModel.create({
        email: demo.email,
        username: demo.username,
        usernameNormalized: demo.username.toLowerCase(),
        passwordHash,
        role: demo.role,
        emailVerified: true,
        region: demo.region,
      }),
    )
  }
  logger.info({ count: users.length }, 'Seeded demo accounts')

  const primary = users[0]
  const lecturer = users[2]
  if (!primary || !lecturer) {
    throw new Error('Demo accounts could not be created')
  }

  // ---- Enrolments --------------------------------------------------------
  if ((await EnrollmentModel.countDocuments({ user: primary._id })) === 0) {
    await EnrollmentModel.insertMany(
      demoEnrollments.map((course) => ({ ...course, user: primary._id })),
    )
  }

  // ---- Posts -------------------------------------------------------------
  if ((await PostModel.countDocuments({})) === 0) {
    const posts = await PostModel.insertMany(
      demoPosts.map((post, index) => ({
        ...post,
        author: index === 1 ? lecturer._id : primary._id,
        authorName: post.authorName,
        likeCount: post.likes,
        createdAt: new Date(Date.now() - (index + 1) * 3_600_000),
      })),
    )
    logger.info({ count: posts.length }, 'Seeded community posts')
  }

  // ---- Messages ----------------------------------------------------------
  if ((await MessageModel.countDocuments({ recipient: primary._id })) === 0) {
    await MessageModel.insertMany(
      demoMessages.map((message, index) => ({
        ...message,
        sender: lecturer._id,
        recipient: primary._id,
        unread: index < 2,
        createdAt: new Date(Date.now() - (index + 1) * 7_200_000),
      })),
    )
  }

  // ---- Assignments -------------------------------------------------------
  if ((await AssignmentModel.countDocuments({})) === 0) {
    await AssignmentModel.insertMany(
      demoAssignments.map((assignment) => ({ ...assignment, createdBy: lecturer._id })),
    )
  }

  // ---- Notifications -----------------------------------------------------
  if ((await NotificationModel.countDocuments({ user: primary._id })) === 0) {
    await NotificationModel.insertMany([
      {
        user: primary._id,
        kind: 'assignment',
        title: 'New assignment posted',
        body: 'Calculus Problem Set 3 is due in 2 days.',
        read: false,
      },
      {
        user: primary._id,
        kind: 'message',
        title: 'New message from Dr. Sarah Okonkwo',
        body: 'Mathematics Assignment Due',
        read: false,
      },
      {
        user: primary._id,
        kind: 'community',
        title: 'OOU Computer Science 100L posted an update',
        body: 'Test venue for CSC 102 has changed to Lecture Hall B.',
        read: false,
      },
    ])
  }

  logger.info(
    {
      accounts: demoUsers.map((user) => user.email),
      password: DEMO_PASSWORD,
    },
    'Seed complete',
  )

  await disconnectDatabase()
}

seed().catch(async (error) => {
  logger.error({ err: error }, 'Seeding failed')
  await mongoose.disconnect().catch(() => undefined)
  process.exit(1)
})
