/**
 * Home-page advertisement placements.
 *
 * These are demo placements so a fresh install has something useful to show.
 * Replace an entry (or point the Home service at a database collection) when
 * real schools and educators start buying placements.
 */
export type AdvertisementKind = 'school' | 'teaching'

export interface Advertisement {
  id: string
  kind: AdvertisementKind
  /** Institution or educator name. */
  title: string
  subtitle: string
  description: string
  location: string
  badge: string
  ctaLabel: string
  ctaUrl: string
}

export const schoolAdvertisements: Advertisement[] = [
  {
    id: 'school-bright-future',
    kind: 'school',
    title: 'Bright Future Academy',
    subtitle: 'Admissions open for the 2026/2027 session',
    description:
      'Nursery, primary and secondary places with small classes, STEM labs and after-school tutoring.',
    location: 'Lekki, Lagos',
    badge: 'Admissions',
    ctaLabel: 'View school',
    ctaUrl: 'https://example.com/bright-future-academy',
  },
  {
    id: 'school-crown-heights',
    kind: 'school',
    title: 'Crown Heights College',
    subtitle: 'STEM scholarships for outstanding students',
    description:
      'Full and partial scholarships for JSS 1 and SSS 1 entrants with strong maths and science results.',
    location: 'Abuja, FCT',
    badge: 'Scholarships',
    ctaLabel: 'Apply for a place',
    ctaUrl: 'https://example.com/crown-heights-college',
  },
  {
    id: 'school-riverside',
    kind: 'school',
    title: 'Riverside International School',
    subtitle: 'A new term built around discovery',
    description:
      'Cambridge pathway, music studio and a boarding house designed for focused, joyful learning.',
    location: 'Port Harcourt, Rivers',
    badge: 'Enrolling now',
    ctaLabel: 'Book a tour',
    ctaUrl: 'https://example.com/riverside-international',
  },
]

export const teachingAdvertisements: Advertisement[] = [
  {
    id: 'teaching-waec-maths',
    kind: 'teaching',
    title: 'WAEC Mathematics Clinic',
    subtitle: 'Live weekend revision with Mr. Tunde',
    description:
      'Six weeks of exam-focused algebra, geometry and statistics. Past questions, worked solutions and a private study group.',
    location: 'Online · Saturdays',
    badge: 'Weekend classes',
    ctaLabel: 'Join on WhatsApp',
    ctaUrl: 'https://chat.whatsapp.com/TalmaWaecMathsClinic',
  },
  {
    id: 'teaching-jamb-chemistry',
    kind: 'teaching',
    title: 'JAMB Chemistry Masterclass',
    subtitle: 'Dr. Sarah Okonkwo',
    description:
      'Concept clinics, timed practice papers and weekly score reviews for students targeting 300+.',
    location: 'Online · Tuesdays & Thursdays',
    badge: 'JAMB prep',
    ctaLabel: 'Join on WhatsApp',
    ctaUrl: 'https://chat.whatsapp.com/TalmaJambChemistry',
  },
  {
    id: 'teaching-physics-simple',
    kind: 'teaching',
    title: 'Physics Made Simple',
    subtitle: 'Kofi Mensah · IGCSE & WASSCE',
    description:
      'Motion, electricity and waves explained with demonstrations and past-paper walkthroughs.',
    location: 'Online · Self-paced + live Q&A',
    badge: 'New cohort',
    ctaLabel: 'Join on WhatsApp',
    ctaUrl: 'https://chat.whatsapp.com/TalmaPhysicsMadeSimple',
  },
]
