import {
  schoolAdvertisements,
  teachingAdvertisements,
  type Advertisement,
} from '../../data/advertisements.seed.js'
import {
  listFeaturedEducators,
} from '../users/user.service.js'
import type { FollowUserSummary } from '../users/user.model.js'

export interface HomeEducatorDto extends FollowUserSummary {
  whatsappUrl: string
}

export interface HomeContentDto {
  educators: HomeEducatorDto[]
  schoolAds: Advertisement[]
  teachingAds: Advertisement[]
}

/**
 * Everything the signed-in Home screen needs below the welcome card: verified
 * educators with a published WhatsApp link, plus school and teaching adverts.
 */
export async function getHomeContent(): Promise<HomeContentDto> {
  const summaries = await listFeaturedEducators(6)

  const educators = summaries.filter(
    (educator): educator is HomeEducatorDto => Boolean(educator.whatsappUrl),
  )

  return {
    educators,
    schoolAds: schoolAdvertisements,
    teachingAds: teachingAdvertisements,
  }
}
