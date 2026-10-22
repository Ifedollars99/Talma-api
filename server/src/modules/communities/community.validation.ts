import { z } from 'zod'

export const createCommunitySchema = z.object({
  name: z.string().trim().min(2, 'Community name must be at least 2 characters').max(120),
  desc: z.string().trim().max(500).default(''),
  category: z.string().trim().min(1).max(60).default('Study Group'),
  school: z.string().trim().max(120).default(''),
})

export const listCommunitiesQuerySchema = z.object({
  category: z.string().trim().max(60).optional(),
  search: z.string().trim().max(120).optional(),
})

export const communityIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid community id'),
})

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>
export type ListCommunitiesQuery = z.infer<typeof listCommunitiesQuerySchema>
