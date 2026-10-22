import { AppError } from '../../common/errors/AppError.js'
import { communityDirectory } from '../../data/communities.seed.js'
import { CommunityModel, toCommunityDto, type CommunityDto } from './community.model.js'
import { CommunityMembershipModel } from './communityMembership.model.js'
import type { CreateCommunityInput, ListCommunitiesQuery } from './community.validation.js'

/**
 * Seeds the shared community directory the first time it is needed.
 * Existing communities are never overwritten so user-created ones survive.
 */
async function ensureDirectorySeeded(): Promise<void> {
  const existing = await CommunityModel.countDocuments({ isDirectoryEntry: true })
  if (existing >= communityDirectory.length) return

  for (const entry of communityDirectory) {
    await CommunityModel.updateOne(
      { 'directoryKey': entry.key },
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
}

/** Lists communities with the caller's membership state attached. */
export async function listCommunities(
  userId: string,
  query: ListCommunitiesQuery,
): Promise<CommunityDto[]> {
  await ensureDirectorySeeded()

  const filter: Record<string, unknown> = {}
  if (query.category && query.category !== 'All') {
    filter.category = query.category
  }
  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(escaped, 'i')
    filter.$or = [{ name: pattern }, { desc: pattern }, { school: pattern }]
  }

  const [communities, memberships] = await Promise.all([
    CommunityModel.find(filter).sort({ members: -1, createdAt: 1 }).lean(),
    CommunityMembershipModel.find({ user: userId }).lean(),
  ])

  const joinedIds = new Set(memberships.map((membership) => String(membership.community)))

  return communities.map((community) =>
    toCommunityDto(community, joinedIds.has(String(community._id))),
  )
}

/** Lists the communities the user has joined. */
export async function listMyCommunities(userId: string): Promise<CommunityDto[]> {
  const memberships = await CommunityMembershipModel.find({ user: userId }).lean()
  if (memberships.length === 0) return []

  const communities = await CommunityModel.find({
    _id: { $in: memberships.map((membership) => membership.community) },
  })
    .lean()

  const byId = new Map(communities.map((community) => [String(community._id), community]))
  return memberships
    .map((membership) => {
      const community = byId.get(String(membership.community))
      return community ? toCommunityDto(community, true) : null
    })
    .filter((entry): entry is CommunityDto => entry !== null)
}

/** Creates a new community owned by the user. */
export async function createCommunity(
  userId: string,
  input: CreateCommunityInput,
): Promise<CommunityDto> {
  const community = await CommunityModel.create({
    name: input.name,
    desc: input.desc || 'A brand new student community.',
    category: input.category,
    school: input.school || 'All schools',
    members: 1,
    icon: 'bi-people',
    bg: 'from-[#FBF3E4] to-[#F5E6C8]',
    iconColor: 'text-[#C6862E]',
    lastActive: 'just now',
    createdBy: userId,
    isDirectoryEntry: false,
  })

  await CommunityMembershipModel.create({ user: userId, community: community._id })

  return toCommunityDto(community.toObject(), true)
}

/** Joins a community. */
export async function joinCommunity(userId: string, communityId: string): Promise<CommunityDto> {
  const community = await CommunityModel.findById(communityId)
  if (!community) {
    throw AppError.notFound('Community not found')
  }

  const existing = await CommunityMembershipModel.findOne({ user: userId, community: communityId })
  if (!existing) {
    await CommunityMembershipModel.create({ user: userId, community: communityId })
    community.members += 1
    community.lastActive = 'just now'
    await community.save()
  }

  return toCommunityDto(community.toObject(), true)
}

/** Leaves a community. */
export async function leaveCommunity(userId: string, communityId: string): Promise<CommunityDto> {
  const community = await CommunityModel.findById(communityId)
  if (!community) {
    throw AppError.notFound('Community not found')
  }

  const removed = await CommunityMembershipModel.findOneAndDelete({
    user: userId,
    community: communityId,
  })
  if (removed) {
    community.members = Math.max(0, community.members - 1)
    await community.save()
  }

  return toCommunityDto(community.toObject(), false)
}
