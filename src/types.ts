export type Trophy = {
  hidden: boolean
  id: string
  name: string
  description: string
  iconUrl: string | null
  type: 'bronze' | 'silver' | 'gold' | 'platinum'
  groupName: string | null
  groupId: string
  earned: boolean | null
  earnedRate: number | null
}

export type TrophyCounts = {
  bronze: number
  silver: number
  gold: number
  platinum: number
}

export type Game = {
  id: string
  serviceName: 'trophy' | 'trophy2'
  title: string
  platform: string | null
  iconUrl: string | null
  progress: number | null
  definedTrophies: TrophyCounts | null
  earnedTrophies: TrophyCounts | null
  lastUpdatedAt: string | null
}

export type GamesResponse = {
  source: 'PSN'
  fetchedAt: string
  games: Game[]
}

export type TrophiesResponse = {
  source: 'PSN'
  fetchedAt: string
  gameId: string
  serviceName: Game['serviceName']
  trophies: Trophy[]
}

export type GamesLoadState = 'loading' | 'success' | 'error'
export type SortOrder = 'asc' | 'desc'
export type ProgressFilter = 'all' | 'in-progress' | 'completed'
