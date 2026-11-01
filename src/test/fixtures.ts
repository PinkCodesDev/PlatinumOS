import type { Game, Trophy } from '../types'
export const game: Game = {
  id: 'TEST_GAME',
  serviceName: 'trophy',
  title: 'Test game',
  platform: 'PS4',
  iconUrl: null,
  progress: 25,
  definedTrophies: null,
  earnedTrophies: null,
  lastUpdatedAt: null,
}
const base: Trophy = {
  id: '1',
  name: 'Explorer',
  description: 'Collect all maps',
  iconUrl: null,
  type: 'bronze',
  groupId: 'default',
  groupName: null,
  earned: true,
  earnedRate: 10,
  hidden: false,
}
export const trophies: Trophy[] = [
  base,
  {
    ...base,
    id: '2',
    name: 'DLC explorer',
    description: 'Finish the island',
    type: 'gold',
    groupId: '001',
    groupName: 'Island',
    earned: false,
  },
  {
    ...base,
    id: '3',
    name: 'Secret ending',
    description: 'Defeat the king',
    hidden: true,
    earned: false,
    iconUrl: 'https://example.test/secret.png',
  },
  { ...base, id: '4', name: 'Unknown explorer', earned: null },
]
