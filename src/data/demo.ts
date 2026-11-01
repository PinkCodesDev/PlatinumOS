import type { Game, Trophy, TrophyCounts } from '../types'
export const demoTrophies: Record<string, Trophy[]> = {}
const titles = [
  'Echoes of the Ancients',
  'Neon Horizon',
  'The Last Expedition',
  'Clockwork Gardens',
]
export const demoGames: Game[] = titles.map((title, index) => {
  const id = `DEMO_${index + 1}`
  const earnedCount = [3, 7, 1, 0][index]
  const entries = [
    ['First steps', 'Complete the opening chapter.', 'bronze'],
    ['Explorer', 'Discover every viewpoint in the starting region.', 'bronze'],
    ['Team player', 'Complete the first co-op mission.', 'silver'],
    [
      'Leave nothing behind',
      'Collect all skill fragments during co-op missions.',
      'silver',
    ],
    ['The final guardian', 'Defeat the guardian in the final chapter.', 'gold'],
    [
      'Beyond the horizon',
      'Complete the Island expansion challenges.',
      'bronze',
    ],
    ['A complete journey', 'Earn every base-game trophy.', 'platinum'],
  ] as const
  const trophies: Trophy[] = entries.map(([name, description, type], i) => ({
    id: String(i),
    name,
    description,
    type,
    hidden: i === 4,
    earned: i < earnedCount,
    earnedRate: [94, 65, 42, 18, 12, 9, 4][i],
    groupId: i === 5 ? '001' : 'default',
    groupName: i === 5 ? 'Island expansion' : null,
    iconUrl: `${import.meta.env.BASE_URL}demo/trophy-${type}.svg`,
  }))
  demoTrophies[id] = trophies
  const counts = (earnedOnly: boolean) =>
    trophies.reduce<TrophyCounts>(
      (total, trophy) => {
        if (!earnedOnly || trophy.earned) total[trophy.type]++
        return total
      },
      { bronze: 0, silver: 0, gold: 0, platinum: 0 },
    )
  return {
    id,
    serviceName: 'trophy',
    title,
    platform: index % 2 ? 'PS5' : 'PS4',
    iconUrl: `${import.meta.env.BASE_URL}demo/cover-${index + 1}.svg`,
    progress: Math.round((earnedCount / trophies.length) * 100),
    definedTrophies: counts(false),
    earnedTrophies: counts(true),
    lastUpdatedAt: `2026-10-${30 - index}T12:00:00Z`,
  }
})
export const demoSteps = [
  {
    id: 'demo-step-1',
    title: 'Complete the opening chapter',
    completed: true,
    trophyId: '0',
  },
  {
    id: 'demo-step-2',
    title: 'Collect skill fragments while completing co-op missions',
    completed: false,
  },
  {
    id: 'demo-step-3',
    title: 'Finish the remaining base-game trophies',
    completed: false,
  },
]
export const demoTips = [
  {
    id: 'demo-tip-1',
    text: 'Collect skill fragments during your first co-op run to avoid repeating missions later.',
  },
  {
    id: 'demo-tip-2',
    text: 'Keep expansion tasks separate: focus on base-game trophies first when planning your platinum.',
  },
]
