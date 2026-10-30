import { getTitleTrophies, getUserTrophiesEarnedForTitle } from 'psn-api'
import { PsnError, withTimeout } from './psn-errors.mjs'

const invalidResponse = () =>
  new PsnError('PSN_INVALID_RESPONSE', 'PSN returned invalid trophy data.')

// Each endpoint can return multiple pages, including trophies from DLC.
async function readPages(fetchPage) {
  const trophies = new Map()
  let offset = 0
  for (let page = 0; page < 100; page++) {
    const result = await withTimeout(fetchPage(offset))
    if (!Array.isArray(result?.trophies)) throw invalidResponse()
    for (const trophy of result.trophies) {
      if (!Number.isInteger(trophy?.trophyId) || trophy.trophyId < 0)
        throw invalidResponse()
      trophies.set(trophy.trophyId, trophy)
    }
    if (result.nextOffset == null) return [...trophies.values()]
    if (
      !Number.isInteger(result.nextOffset) ||
      result.nextOffset <= offset ||
      !result.trophies.length
    )
      throw invalidResponse()
    offset = result.nextOffset
  }
  throw invalidResponse()
}

export function createTrophyService({
  auth,
  fetchDefinitions = getTitleTrophies,
  fetchEarned = getUserTrophiesEarnedForTitle,
  now = Date.now,
}) {
  const cache = new Map()
  const pending = new Map()

  async function load(gameId, serviceName) {
    const authorization = await auth.getAuthorization()
    try {
      const options = (offset) => ({
        npServiceName: serviceName,
        limit: 100,
        offset,
      })
      const [definitions, progress] = await Promise.all([
        readPages((offset) =>
          fetchDefinitions(authorization, gameId, 'all', options(offset)),
        ),
        readPages((offset) =>
          fetchEarned(authorization, 'me', gameId, 'all', options(offset)),
        ),
      ])
      const progressById = new Map(
        progress.map((trophy) => [trophy.trophyId, trophy]),
      )
      const trophies = definitions.map((trophy) => {
        if (
          !['bronze', 'silver', 'gold', 'platinum'].includes(trophy.trophyType)
        )
          throw invalidResponse()
        const userTrophy = progressById.get(trophy.trophyId)
        const rawRate = userTrophy?.trophyEarnedRate
        const rate =
          typeof rawRate === 'string' && rawRate.trim() !== ''
            ? Number(rawRate)
            : NaN
        return {
          id: String(trophy.trophyId),
          name: trophy.trophyName || 'Hidden trophy',
          description: trophy.trophyDetail || 'Description unavailable.',
          iconUrl: trophy.trophyIconUrl ?? null,
          type: trophy.trophyType,
          groupId: trophy.trophyGroupId ?? 'default',
          earned:
            typeof userTrophy?.earned === 'boolean' ? userTrophy.earned : null,
          earnedRate:
            Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : null,
        }
      })
      return {
        source: 'PSN',
        fetchedAt: new Date(now()).toISOString(),
        gameId,
        serviceName,
        trophies,
      }
    } catch (error) {
      if (error instanceof PsnError) throw error
      throw new PsnError(
        'PSN_FETCH_FAILED',
        'Cannot load trophies from PSN. Try again later.',
      )
    }
  }

  return {
    async getTrophies(gameId, serviceName) {
      if (
        !/^[A-Za-z0-9_-]{1,64}$/.test(gameId) ||
        !['trophy', 'trophy2'].includes(serviceName)
      )
        throw new PsnError('INVALID_REQUEST', 'Invalid game or service.', 400)
      const key = `${serviceName}:${gameId}`
      const cached = cache.get(key)
      if (cached && cached.expiresAt > now()) return cached.data
      if (!pending.has(key)) {
        pending.set(
          key,
          load(gameId, serviceName)
            .then((data) => {
              if (cache.size >= 50) cache.delete(cache.keys().next().value)
              cache.set(key, { data, expiresAt: now() + 60000 })
              return data
            })
            .finally(() => pending.delete(key)),
        )
      }
      return pending.get(key)
    },
  }
}
