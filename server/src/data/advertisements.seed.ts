/**
 * Demo Home-page advertisement placements.
 *
 * These keep a fresh install useful. Adverts posted by signed-in users are
 * stored in the database and shown before these demo entries.
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
    id: 'teaching-physics-teacher',
    kind: 'teaching',
    title: 'Physics Teacher (Senior Secondary)',
    subtitle: 'Crown Heights College',
    description:
      'Full-time physics teacher needed for SSS 1–3. Strong WAEC and NECO results, a teaching qualification and classroom experience are preferred.',
    location: 'Abuja, FCT · Full-time',
    badge: 'Teaching job',
    ctaLabel: 'Apply now',
    ctaUrl: 'https://example.com/jobs/crown-heights-physics-teacher',
  },
  {
    id: 'teaching-lecturer-computer-science',
    kind: 'teaching',
    title: 'Lecturer II — Computer Science',
    subtitle: 'Riverside Polytechnic',
    description:
      'The department is hiring a lecturer to teach programming, databases and introductory AI. A master’s degree and published research are an advantage.',
    location: 'Port Harcourt, Rivers · Full-time',
    badge: 'Lecturer role',
    ctaLabel: 'View vacancy',
    ctaUrl: 'https://example.com/jobs/riverside-lecturer-computer-science',
  },
  {
    id: 'teaching-waec-maths-tutor',
    kind: 'teaching',
    title: 'WAEC Mathematics Tutor',
    subtitle: 'Bright Future Academy',
    description:
      'Weekend revision tutor wanted for a small WAEC cohort. Run exam-focused algebra, geometry and statistics clinics with past-question walkthroughs.',
    location: 'Lekki, Lagos · Part-time',
    badge: 'Part-time',
    ctaLabel: 'Apply now',
    ctaUrl: 'https://example.com/jobs/bright-future-waec-maths-tutor',
  },
]
