import test from 'node:test'
import assert from 'node:assert/strict'
import { createRecentService } from './recent-service.mjs'
const auth = { getAuthorization: async () => ({ accessToken: 'fake' }) }
test('recent activity uses play dates, filters invalid dates and shares cached requests', async () => {
  let calls = 0
  const service = createRecentService({
    auth,
    fetchPlayed: async () => {
      calls++
      return {
        titles: [
          {
            name: 'Old',
            lastPlayedDateTime: '2025-01-01',
            category: 'ps4_game',
          },
          {
            name: 'New',
            lastPlayedDateTime: '2026-01-01',
            category: 'ps5_native_game',
            imageUrl: 'https://example.com/cover.png',
            private: 'secret',
          },
          { name: 'Invalid', lastPlayedDateTime: 'bad' },
        ],
      }
    },
  })
  const [a, b] = await Promise.all([service.getRecent(), service.getRecent()])
  assert.deepEqual(a, b)
  assert.deepEqual(
    a.games.map((g) => g.title),
    ['New', 'Old'],
  )
  assert.equal(a.games[0].platform, 'PS5')
  assert.equal(JSON.stringify(a).includes('secret'), false)
  await service.getRecent()
  assert.equal(calls, 1)
})
test('recent provider errors are sanitized and retryable', async () => {
  let calls = 0
  const service = createRecentService({
    auth,
    fetchPlayed: async () => {
      if (!calls++) throw Error('secret')
      return { titles: [] }
    },
  })
  await assert.rejects(
    service.getRecent(),
    (error) =>
      error.code === 'PSN_FETCH_FAILED' && !error.message.includes('secret'),
  )
  assert.deepEqual(await service.getRecent(), { games: [] })
})
