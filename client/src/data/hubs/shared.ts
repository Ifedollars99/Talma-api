/** Shared types for the Discover hub content modules. */
export interface HubItem {
  title: string
  desc: string
  tag?: string
}

export interface HubCategory {
  id: string
  short: string
  title: string
  desc: string
  icon: string
  bg: string
  iconColor: string
  source?: string
  items: HubItem[]
}
