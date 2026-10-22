import { z } from 'zod'

/** Shared pagination query parameters. */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type Pagination = z.infer<typeof paginationQuery>

export interface Paginated<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** Builds a consistent pagination envelope around a list of documents. */
export function paginate<T>(
  items: T[],
  total: number,
  { page, limit }: Pagination,
): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return {
    items,
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/** Converts a 1-based page number into a MongoDB `skip`. */
export function toSkip(page: number, limit: number): number {
  return (page - 1) * limit
}
