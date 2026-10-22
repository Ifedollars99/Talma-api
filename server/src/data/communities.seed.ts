// Communities directory: joinable student communities grouped by category.
// Member counts are starter figures for the seeded directory entries.

export interface SeedCommunity {
  key: string
  name: string
  desc: string
  category: string
  school: string
  members: number
  icon: string
  bg: string
  iconColor: string
  lastActive: string
}

export const communityDirectory: SeedCommunity[] = [
  {
    key: 'csc-100-oou',
    name: 'OOU Computer Science 100L',
    desc: 'Class updates, test venues, assignments and past questions for CSC freshers.',
    category: 'Department',
    school: 'OOU · Main Campus',
    members: 342,
    icon: 'bi-laptop',
    bg: 'from-[#FBF3E4] to-[#F5E6C8]',
    iconColor: 'text-[#C6862E]',
    lastActive: '12 min ago',
  },
  {
    key: 'mac-oou',
    name: 'OOU Mass Communication Hub',
    desc: 'Newsroom practice, broadcast slots, press club gist and departmental notices.',
    category: 'Department',
    school: 'OOU · Main Campus',
    members: 218,
    icon: 'bi-broadcast',
    bg: 'from-[#E9F2EF] to-[#D4E8E1]',
    iconColor: 'text-[#2F6F5E]',
    lastActive: '1 hr ago',
  },
  {
    key: 'aspirants-2026',
    name: 'OOU Aspirants 2026',
    desc: 'Post-UTME prep, cut-off tracking, CAPS help and admission gist.',
    category: 'Admission',
    school: 'OOU · All campuses',
    members: 1204,
    icon: 'bi-mortarboard',
    bg: 'from-[#E9F2EF] to-[#D4E8E1]',
    iconColor: 'text-[#2F6F5E]',
    lastActive: '5 min ago',
  },
  {
    key: 'siwes-2026',
    name: 'SIWES 2026 Batch',
    desc: 'Placements, logbook samples, ITF forms help and defence prep.',
    category: 'Career',
    school: 'All schools',
    members: 486,
    icon: 'bi-briefcase',
    bg: 'from-[#EFEAE0] to-[#E4D9CC]',
    iconColor: 'text-[#1C2B39]',
    lastActive: '26 min ago',
  },
  {
    key: 'final-year-oou',
    name: 'OOU Finalists Forum',
    desc: 'Project topics, supervisors, defence tips and clearance checklist.',
    category: 'Academic',
    school: 'OOU · All campuses',
    members: 377,
    icon: 'bi-award',
    bg: 'from-[#FBF3E4] to-[#F5E6C8]',
    iconColor: 'text-[#C6862E]',
    lastActive: '2 hrs ago',
  },
  {
    key: 'maths-study',
    name: 'Maths & Physics Study Circle',
    desc: 'Weekly problem sessions, timed mocks and formula sheets.',
    category: 'Study Group',
    school: 'All schools',
    members: 264,
    icon: 'bi-calculator',
    bg: 'from-[#EFEAE0] to-[#E4D9CC]',
    iconColor: 'text-[#1C2B39]',
    lastActive: '44 min ago',
  },
  {
    key: 'campus-market',
    name: 'Campus Marketplace',
    desc: 'Verified student vendors: food, thrift, gadgets, printing.',
    category: 'Campus Life',
    school: 'OOU · Ago-Iwoye',
    members: 893,
    icon: 'bi-bag',
    bg: 'from-[#E9F2EF] to-[#D4E8E1]',
    iconColor: 'text-[#2F6F5E]',
    lastActive: '8 min ago',
  },
  {
    key: 'lost-found',
    name: 'OOU Lost & Found',
    desc: 'Report and recover ID cards, phones and documents.',
    category: 'Campus Life',
    school: 'OOU · All campuses',
    members: 156,
    icon: 'bi-search',
    bg: 'from-[#FBF3E4] to-[#F5E6C8]',
    iconColor: 'text-[#C6862E]',
    lastActive: '3 hrs ago',
  },
  {
    key: 'unilag-tech',
    name: 'UNILAG Tech Community',
    desc: 'Dev meetups, hackathons, internships and design reviews.',
    category: 'Study Group',
    school: 'UNILAG · Akoka',
    members: 512,
    icon: 'bi-code-slash',
    bg: 'from-[#EFEAE0] to-[#E4D9CC]',
    iconColor: 'text-[#1C2B39]',
    lastActive: '19 min ago',
  },
]

export const communityCategories = [
  'All',
  'Department',
  'Study Group',
  'Academic',
  'Admission',
  'Career',
  'Campus Life',
]
