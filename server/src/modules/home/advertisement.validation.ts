import { z } from 'zod'

const httpUrl = z
  .string()
  .trim()
  .max(500, 'That link is too long')
  .url('Enter a valid link')
  .refine(
    (value) => /^https?:\/\//i.test(value),
    'The link must start with http:// or https://',
  )

/**
 * Any signed-in account may advertise a school or share a teaching vacancy.
 * The badge and button label are optional because the API supplies sensible
 * defaults for each kind.
 */
export const createAdvertisementSchema = z.object({
  kind: z.enum(['school', 'teaching'], {
    errorMap: () => ({ message: 'Choose a valid advert type' }),
  }),
  title: z.string().trim().min(2, 'Add a title').max(120, 'That title is too long'),
  subtitle: z.string().trim().min(2, 'Add a short subtitle').max(160, 'That subtitle is too long'),
  description: z
    .string()
    .trim()
    .min(10, 'Add a little more detail')
    .max(2000, 'That description is too long'),
  location: z.string().trim().min(2, 'Add a location').max(120, 'That location is too long'),
  ctaUrl: httpUrl,
  badge: z.string().trim().max(40, 'That badge is too long').optional(),
  ctaLabel: z.string().trim().max(40, 'That button label is too long').optional(),
})

export type CreateAdvertisementInput = z.infer<typeof createAdvertisementSchema>
