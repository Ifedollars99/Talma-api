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
import { FollowModel } from '../modules/users/follow.model.js'
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
import { VideoModel } from '../modules/videos/video.model.js'
import { VideoPurchaseModel } from '../modules/videos/videoPurchase.model.js'
import { CreatorProfileModel } from '../modules/creators/creator.model.js'

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
  {
    username: 'TalmaAdmin',
    email: 'admin@talma.app',
    role: 'admin' as const,
    region: 'Nigeria',
  },
]

/** Educational creators shown on a fresh (or existing) install. */
const demoCreators = [
  {
    username: 'AdaCreates',
    email: 'ada.creates@example.com',
    region: 'Nigeria',
    state: 'Lagos',
    gender: 'female' as const,
    bio: 'Maths teacher making calculus and algebra feel simple. Short lessons, worked examples, zero panic.',
    posts: [
      {
        subject: 'Advanced Mathematics',
        content:
          'A limit is just asking: where is this function heading? If the left and right sides agree, that is your limit. Try sketching the graph before doing any algebra.',
      },
      {
        subject: 'Advanced Mathematics',
        content:
          'Quick integration trick: when you see a product of two functions, ask whether one is the derivative of the other. Substitution saves more time than integration by parts here.',
      },
    ],
  },
  {
    username: 'KofiLearns',
    email: 'kofi.learns@example.com',
    region: 'Ghana',
    state: 'Greater Accra',
    gender: 'male' as const,
    bio: 'Physics tutor. I turn formulas into stories about motion, forces and energy.',
    posts: [
      {
        subject: 'Physics Science',
        content:
          'Newton’s second law is not just F = ma. It tells you that a bigger mass needs a bigger force for the same acceleration. Draw the free-body diagram first — always.',
      },
      {
        subject: 'Physics Science',
        content:
          'Projectile motion tip: split the problem into horizontal and vertical motion. The only thing they share is time. Solve the vertical part first to find that time.',
      },
    ],
  },
  {
    username: 'ZaraTeaches',
    email: 'zara.teaches@example.com',
    region: 'Kenya',
    state: 'Nairobi',
    gender: 'female' as const,
    bio: 'Biology educator. Cells, genetics and exam-ready diagrams explained without the jargon.',
    posts: [
      {
        subject: 'Biology',
        content:
          'Mitosis vs meiosis: mitosis makes identical copies for growth; meiosis makes unique sex cells for reproduction. If the question says “genetic variation”, think meiosis.',
      },
      {
        subject: 'Biology',
        content:
          'When drawing a cell diagram for an exam, label the membrane, cytoplasm, nucleus and mitochondria first. Those four labels appear in almost every marking scheme.',
      },
    ],
  },
  {
    username: 'TundeCodes',
    email: 'tunde.codes@example.com',
    region: 'Nigeria',
    state: 'Oyo',
    gender: 'male' as const,
    bio: 'Software engineer and part-time tutor. I explain programming with small, runnable examples.',
    posts: [
      {
        subject: 'Computer Science',
        content:
          'Arrays vs linked lists: arrays give O(1) access but costly inserts; linked lists give O(1) inserts but linear search. Choose based on what your program does most.',
      },
      {
        subject: 'Computer Science',
        content:
          'Debugging tip: reproduce the bug with the smallest possible input. If you can explain the bug in one sentence, you are already halfway to fixing it.',
      },
    ],
  },
  {
    username: 'AmaraStudies',
    email: 'amara.studies@example.com',
    region: 'South Africa',
    state: 'Gauteng',
    gender: 'female' as const,
    bio: 'Study-skills coach. I share revision systems that actually fit a busy student timetable.',
    posts: [
      {
        subject: 'Study Skills',
        content:
          'Try active recall instead of rereading: close the book and write everything you remember, then check what you missed. It feels harder because it is working.',
      },
      {
        subject: 'Study Skills',
        content:
          'Plan revision in 25-minute blocks with a 5-minute break. Four focused blocks beat a four-hour session where you keep switching tabs.',
      },
    ],
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
    FollowModel.deleteMany({}),
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
    VideoModel.deleteMany({}),
    VideoPurchaseModel.deleteMany({}),
    CreatorProfileModel.deleteMany({}),
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

  // ---- Verified creator profiles ----------------------------------------
  // Idempotent so existing databases pick up the demo creators without a wipe.
  const creators = []
  for (const demo of demoCreators) {
    let creator = await UserModel.findOne({ email: demo.email })
    if (!creator) {
      creator = await UserModel.create({
        email: demo.email,
        username: demo.username,
        usernameNormalized: demo.username.toLowerCase(),
        passwordHash,
        role: 'creator',
        creatorStatus: 'approved',
        creatorVerifiedAt: new Date(),
        emailVerified: true,
        region: demo.region,
        state: demo.state,
        gender: demo.gender,
        bio: demo.bio,
      })
    } else {
      creator.role = 'creator'
      creator.creatorStatus = 'approved'
      creator.creatorVerifiedAt ??= new Date()
      creator.emailVerified = true
      creator.region = demo.region
      creator.state = demo.state
      creator.gender = demo.gender
      creator.bio = demo.bio
      await creator.save()
    }
    creators.push(creator)
  }
  logger.info({ count: creators.length }, 'Seeded verified creator profiles')

  for (const [index, demo] of demoCreators.entries()) {
    const creator = creators[index]
    if (!creator) continue
    const existingPosts = await PostModel.countDocuments({ author: creator._id })
    if (existingPosts > 0) continue

    await PostModel.insertMany(
      demo.posts.map((post, postIndex) => ({
        author: creator._id,
        authorName: demo.username,
        authorUsername: demo.username,
        authorRole: 'creator' as const,
        content: post.content,
        subject: post.subject,
        mediaType: 'none' as const,
        likeCount: 4 + index * 3 + postIndex,
        createdAt: new Date(Date.now() - (index + 1) * 5_400_000 - postIndex * 1_800_000),
      })),
    )
  }
  logger.info('Seeded educational creator posts')

  // Backfill links for posts created before usernames were denormalised.
  const postsMissingUsername = await PostModel.find({
    $or: [{ authorUsername: { $exists: false } }, { authorUsername: '' }],
  })
  if (postsMissingUsername.length > 0) {
    const authorIds = [...new Set(postsMissingUsername.map((post) => String(post.author)))]
    const authors = await UserModel.find({ _id: { $in: authorIds } })
      .select('_id username')
      .lean()
    const usernames = new Map(authors.map((author) => [String(author._id), author.username]))
    await Promise.all(
      postsMissingUsername.map((post) => {
        const username = usernames.get(String(post.author))
        return username
          ? PostModel.updateOne({ _id: post._id }, { $set: { authorUsername: username } })
          : Promise.resolve()
      }),
    )
  }

  const primary = users[0]
  const lecturer = users[2]
  if (!primary || !lecturer) {
    throw new Error('Demo accounts could not be created')
  }

  // ---- Follow graph ------------------------------------------------------
  // Give the demo creators a small, realistic network and let the primary demo
  // account arrive with a populated Following feed. Upserts keep this safe to
  // re-run against an existing database.
  for (const [index, creator] of creators.entries()) {
    const targets = [
      creators[(index + 1) % creators.length],
      creators[(index + 2) % creators.length],
    ].filter(Boolean)

    for (const target of targets) {
      if (!target || String(target._id) === String(creator._id)) continue
      await FollowModel.updateOne(
        { follower: creator._id, following: target._id },
        { $setOnInsert: { follower: creator._id, following: target._id } },
        { upsert: true },
      )
    }

    await FollowModel.updateOne(
      { follower: primary._id, following: creator._id },
      { $setOnInsert: { follower: primary._id, following: creator._id } },
      { upsert: true },
    )
  }
  logger.info('Seeded demo follow graph')

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
