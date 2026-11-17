import mongoose from 'mongoose'
import {
  schoolAdvertisements,
  teachingAdvertisements,
} from '../../data/advertisements.seed.js'
import {
  AdvertisementModel,
  toAdvertisementDto,
  type AdvertisementDto,
  type AdvertisementKind,
} from './advertisement.model.js'
import type { CreateAdvertisementInput } from './advertisement.validation.js'
import { listFeaturedEducators } from '../users/user.service.js'
import type { FollowUserSummary } from '../users/user.model.js'

export interface HomeEducatorDto extends FollowUserSummary {
  whatsappUrl: string
}

export interface HomeContentDto {
  educators: HomeEducatorDto[]
  schoolAds: AdvertisementDto[]
  teachingAds: AdvertisementDto[]
}

/** Community adverts are shown newest first, followed by the demo placements. */
async function listCommunityAdvertisements(kind: AdvertisementKind): Promise<AdvertisementDto[]> {
  const advertisements = await AdvertisementModel.find({ kind }).sort({ createdAt: -1 }).limit(30)
  return advertisements.map(toAdvertisementDto)
}

/** Creates a school or teaching advert on behalf of any signed-in account. */
export async function createAdvertisement(
  userId: string,
  authorName: string,
  input: CreateAdvertisementInput,
): Promise<AdvertisementDto> {
  const isSchool = input.kind === 'school'
  const advertisement = await AdvertisementModel.create({
    kind: input.kind,
    title: input.title,
    subtitle: input.subtitle,
    description: input.description,
    location: input.location,
    badge: input.badge?.trim() || (isSchool ? 'Admissions' : 'Job opportunity'),
    ctaLabel: input.ctaLabel?.trim() || (isSchool ? 'Learn more' : 'Apply now'),
    ctaUrl: input.ctaUrl,
    authorId: new mongoose.Types.ObjectId(userId),
    authorName,
  })

  return toAdvertisementDto(advertisement)
}

/**
 * Everything the signed-in Home screen needs below the welcome card: verified
 * educators with a published WhatsApp link, plus school and teaching adverts
 * posted by the community alongside the demo placements.
 */
export async function getHomeContent(): Promise<HomeContentDto> {
  const [summaries, communitySchoolAds, communityTeachingAds] = await Promise.all([
    listFeaturedEducators(6),
    listCommunityAdvertisements('school'),
    listCommunityAdvertisements('teaching'),
  ])

  const educators = summaries.filter(
    (educator): educator is HomeEducatorDto => Boolean(educator.whatsappUrl),
  )

  return {
    educators,
    schoolAds: [...communitySchoolAds, ...schoolAdvertisements],
    teachingAds: [...communityTeachingAds, ...teachingAdvertisements],
  }
}
