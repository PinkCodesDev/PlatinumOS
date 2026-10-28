import assert from 'node:assert/strict'
import test from 'node:test'
import { createPsnAuth } from './psn-auth.mjs'
import { createPsnService } from './psn-service.mjs'
import { withTimeout } from './psn-errors.mjs'

const tokens = {
  accessToken: 'fake-access',
  refreshToken: 'fake-refresh',
  expiresIn: 60,
  refreshTokenExpiresIn: 3600,
}
const game = (id) => ({
  npCommunicationId: id,
  npServiceName: 'trophy',
  trophyTitleName: 'Demo game',
  trophyTitlePlatform: 'PS4',
  progress: 20,
  earnedTrophies: { bronze: 1, silver: 0, gold: 0, platinum: 0 },
  definedTrophies: { bronze: 5, silver: 0, gold: 0, platinum: 0 },
})

test('missing configuration never calls PSN', async () => {
  const auth = createPsnAuth({
    npsso: null,
    exchangeCode: () => assert.fail('network call'),
  })
  assert.equal(auth.status().state, 'not_configured')
  await assert.rejects(auth.getAuthorization(), { code: 'PSN_NOT_CONFIGURED' })
})

test('concurrent requests share login; expiry triggers refresh', async () => {
  let clock = 0
  let logins = 0
  let refreshes = 0
  const auth = createPsnAuth({
    npsso: 'fake-npsso',
    now: () => clock,
    exchangeCode: async () => {
      logins++
      return 'code'
    },
    exchangeTokens: async () => tokens,
    refreshTokens: async (value) => {
      assert.equal(value, 'fake-refresh')
      refreshes++
      return tokens
    },
  })
  assert.equal(auth.status().authenticated, false)
  await Promise.all([auth.getAuthorization(), auth.getAuthorization()])
  assert.equal(logins, 1)
  assert.equal(auth.status().authenticated, true)
  assert.equal(JSON.stringify(auth.status()).includes('fake-'), false)
  clock = 40000
  await auth.getAuthorization()
  assert.equal(refreshes, 1)
  clock = 4000000
  await auth.getAuthorization()
  assert.equal(logins, 2)
})

test('provider errors are sanitized and failed authentication has cooldown', async () => {
  let calls = 0
  const auth = createPsnAuth({
    npsso: 'fake-secret',
    exchangeCode: async () => {
      calls++
      throw new Error('fake-secret')
    },
  })
  for (let attempt = 0; attempt < 2; attempt++) {
    await assert.rejects(
      auth.getAuthorization(),
      (error) =>
        error.code === 'PSN_AUTH_FAILED' &&
        !error.message.includes('fake-secret'),
    )
  }
  assert.equal(calls, 1)
  assert.equal(auth.status().state, 'authentication_failed')
})

test('games paginate, deduplicate and cache without exposing provider extras', async () => {
  const offsets = []
  const service = createPsnService({
    auth: { getAuthorization: async () => ({ accessToken: 'fake-access' }) },
    fetchTitles: async (_, account, { offset }) => {
      assert.equal(account, 'me')
      offsets.push(offset)
      return offset === 0
        ? {
            trophyTitles: [{ ...game('A'), privateField: 'secret' }],
            nextOffset: 1,
          }
        : { trophyTitles: [game('A'), game('B')] }
    },
  })
  const [first, second] = await Promise.all([
    service.getGames(),
    service.getGames(),
  ])
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.games.map((entry) => entry.id),
    ['A', 'B'],
  )
  assert.equal(JSON.stringify(first).includes('secret'), false)
  await service.getGames()
  assert.deepEqual(offsets, [0, 1])
})

test('empty library is successful; absent counts stay unknown', async () => {
  const auth = { getAuthorization: async () => ({}) }
  const empty = createPsnService({
    auth,
    fetchTitles: async () => ({ trophyTitles: [] }),
  })
  assert.deepEqual((await empty.getGames()).games, [])
  const missing = createPsnService({
    auth,
    fetchTitles: async () => ({
      trophyTitles: [{ ...game('A'), earnedTrophies: undefined }],
    }),
  })
  assert.equal((await missing.getGames()).games[0].earnedTrophies, null)
})

test('repeated pagination offset fails instead of looping', async () => {
  const service = createPsnService({
    auth: { getAuthorization: async () => ({}) },
    fetchTitles: async () => ({ trophyTitles: [game('A')], nextOffset: 0 }),
  })
  await assert.rejects(service.getGames(), { code: 'PSN_INVALID_RESPONSE' })
})

test('request timeout returns a controlled error', async () => {
  await assert.rejects(withTimeout(new Promise(() => {}), 5), {
    code: 'PSN_TIMEOUT',
  })
})
