import { getUserPlayedGames } from 'psn-api'
import { PsnError, withTimeout } from './psn-errors.mjs'
export function createRecentService({
  auth,
  fetchPlayed = getUserPlayedGames,
  now = Date.now,
}) {
  let cache
  let pending
  return {
    async getRecent() {
      if (cache && cache.until > now()) return cache.data
      if (!pending)
        pending = (async () => {
          try {
            const authorization = await auth.getAuthorization()
            const result = await withTimeout(
              fetchPlayed(authorization, 'me', { limit: 100, offset: 0 }),
            )
            if (!Array.isArray(result?.titles))
              throw new Error('Invalid response')
            const games = result.titles
              .filter(
                (g) =>
                  typeof g.name === 'string' &&
                  Number.isFinite(Date.parse(g.lastPlayedDateTime)),
              )
              .sort(
                (a, b) =>
                  Date.parse(b.lastPlayedDateTime) -
                  Date.parse(a.lastPlayedDateTime),
              )
              .slice(0, 4)
              .map((g) => ({
                title: g.name,
                iconUrl:
                  typeof g.imageUrl === 'string' &&
                  g.imageUrl.startsWith('https://')
                    ? g.imageUrl
                    : null,
                platform:
                  g.category === 'ps5_native_game'
                    ? 'PS5'
                    : g.category === 'ps4_game'
                      ? 'PS4'
                      : 'PlayStation',
                lastPlayedAt: g.lastPlayedDateTime,
              }))
            const data = { games }
            cache = { data, until: now() + 60000 }
            return data
          } catch (error) {
            if (error instanceof PsnError) throw error
            throw new PsnError(
              'PSN_FETCH_FAILED',
              'Could not load recently played games.',
            )
          }
        })().finally(() => {
          pending = null
        })
      return pending
    },
  }
}
