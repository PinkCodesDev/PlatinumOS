import { getUserTitles } from 'psn-api'
import { PsnError, withTimeout } from './psn-errors.mjs'

function mapGame(title) {
  if (
    !title?.npCommunicationId ||
    !title.trophyTitleName ||
    !['trophy', 'trophy2'].includes(title.npServiceName)
  ) {
    throw new PsnError('PSN_INVALID_RESPONSE', 'PSN returned an invalid game.')
  }
  const counts = (value) => {
    const grades = ['bronze', 'silver', 'gold', 'platinum']
    if (
      !value ||
      !grades.every(
        (grade) => Number.isInteger(value[grade]) && value[grade] >= 0,
      )
    )
      return null
    return Object.fromEntries(grades.map((grade) => [grade, value[grade]]))
  }
  return {
    id: title.npCommunicationId,
    serviceName: title.npServiceName,
    title: title.trophyTitleName,
    platform: title.trophyTitlePlatform ?? null,
    iconUrl: title.trophyTitleIconUrl ?? null,
    progress:
      Number.isFinite(title.progress) &&
      title.progress >= 0 &&
      title.progress <= 100
        ? title.progress
        : null,
    definedTrophies: counts(title.definedTrophies),
    earnedTrophies: counts(title.earnedTrophies),
    lastUpdatedAt: title.lastUpdatedDateTime ?? null,
  }
}

export function createPsnService({
  auth,
  fetchTitles = getUserTitles,
  now = Date.now,
}) {
  let cache = null
  let pending = null

  async function fetchGames() {
    const games = new Map()
    let offset = 0
    for (let page = 0; page < 100; page += 1) {
      const authorization = await auth.getAuthorization()
      let result
      try {
        result = await withTimeout(
          fetchTitles(authorization, 'me', { limit: 100, offset }),
        )
      } catch (error) {
        if (error instanceof PsnError) throw error
        throw new PsnError(
          'PSN_FETCH_FAILED',
          'Cannot load games from PSN. Check access, connection or try again later.',
        )
      }
      if (!Array.isArray(result?.trophyTitles)) {
        throw new PsnError(
          'PSN_INVALID_RESPONSE',
          'PSN returned an invalid game list.',
        )
      }
      for (const title of result.trophyTitles) {
        const game = mapGame(title)
        games.set(`${game.serviceName}:${game.id}`, game)
      }
      const next = result.nextOffset
      if (next === undefined || next === null) {
        const data = {
          source: 'PSN',
          fetchedAt: new Date(now()).toISOString(),
          games: [...games.values()],
        }
        cache = { data, expiresAt: now() + 60000 }
        return data
      }
      if (
        !Number.isInteger(next) ||
        next <= offset ||
        result.trophyTitles.length === 0
      ) {
        throw new PsnError(
          'PSN_INVALID_RESPONSE',
          'PSN returned invalid pagination.',
        )
      }
      offset = next
    }
    throw new PsnError(
      'PSN_PAGE_LIMIT',
      'Library exceeded the local pagination safety limit.',
    )
  }

  return {
    async getGames() {
      if (cache && cache.expiresAt > now()) return cache.data
      if (!pending)
        pending = fetchGames().finally(() => {
          pending = null
        })
      return pending
    },
  }
}
