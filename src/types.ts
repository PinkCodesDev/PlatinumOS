export type Trophy = {
  id: string
  name: string
  description: string
  iconUrl: string | null
  type: 'bronze' | 'silver' | 'gold' | 'platinum'
  groupId: string
  earned: boolean
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
