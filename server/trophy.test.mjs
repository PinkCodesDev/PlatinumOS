import assert from 'node:assert/strict'
import test from 'node:test'
import { createTrophyService } from './trophy-service.mjs'

const auth = { getAuthorization: async () => ({ accessToken: 'fake' }) }
const definition = (id) => ({
  trophyId: id,
  trophyType: 'bronze',
  trophyName: `Trophy ${id}`,
  trophyDetail: 'Do something',
  trophyGroupId: id === 0 ? 'default' : '001',
})

test('trophies join by ID, paginate both endpoints, share requests and expire cache', async () => {
  let clock = 0
  const calls = []
  const service = createTrophyService({
    auth,
    now: () => clock,
    fetchDefinitions: async (_, id, group, options) => {
      assert.equal(id, 'NPWR12345_00')
      assert.equal(group, 'all')
      assert.equal(options.npServiceName, 'trophy2')
      calls.push(`d${options.offset}`)
      return options.offset === 0
        ? { trophies: [definition(0)], nextOffset: 1 }
        : { trophies: [definition(1)] }
    },
    fetchEarned: async (_, account, id, group, options) => {
      assert.equal(account, 'me')
      assert.equal(group, 'all')
      calls.push(`u${options.offset}`)
      return options.offset === 0
        ? {
            trophies: [{ trophyId: 1, earned: false, trophyEarnedRate: '0.0' }],
            nextOffset: 1,
          }
        : {
            trophies: [
              {
                trophyId: 0,
                earned: true,
                trophyEarnedRate: '12.5',
                secret: 'do-not-export',
              },
            ],
          }
    },
  })
  const [a, b] = await Promise.all([
    service.getTrophies('NPWR12345_00', 'trophy2'),
    service.getTrophies('NPWR12345_00', 'trophy2'),
  ])
  assert.deepEqual(a, b)
  assert.deepEqual(
    a.trophies.map((t) => [t.id, t.earned, t.earnedRate]),
    [
      ['0', true, 12.5],
      ['1', false, 0],
    ],
  )
  assert.equal(JSON.stringify(a).includes('do-not-export'), false)
  await service.getTrophies('NPWR12345_00', 'trophy2')
  assert.equal(calls.length, 4)
  clock = 60001
  await service.getTrophies('NPWR12345_00', 'trophy2')
  assert.equal(calls.length, 8)
})

test('missing trophy status and rarity stay unknown; empty lists are valid', async () => {
  const service = createTrophyService({
    auth,
    fetchDefinitions: async () => ({ trophies: [definition(0)] }),
    fetchEarned: async () => ({ trophies: [] }),
  })
  const { trophies } = await service.getTrophies('A', 'trophy')
  assert.equal(trophies[0].earned, null)
  assert.equal(trophies[0].earnedRate, null)
  const empty = createTrophyService({
    auth,
    fetchDefinitions: async () => ({ trophies: [] }),
    fetchEarned: async () => ({ trophies: [] }),
  })
  assert.deepEqual((await empty.getTrophies('A', 'trophy')).trophies, [])
})

test('invalid input never reaches PSN', async () => {
  const service = createTrophyService({
    auth: { getAuthorization: () => assert.fail('network') },
  })
  for (const [id, name] of [
    ['../x', 'trophy'],
    ['', 'trophy'],
    ['A', 'bad'],
  ]) {
    await assert.rejects(service.getTrophies(id, name), {
      code: 'INVALID_REQUEST',
      status: 400,
    })
  }
})

test('bad pagination and malformed response are rejected', async () => {
  for (const response of [
    { trophies: [definition(0)], nextOffset: 0 },
    { trophies: [{}] },
    {},
  ]) {
    const service = createTrophyService({
      auth,
      fetchDefinitions: async () => response,
      fetchEarned: async () => ({ trophies: [] }),
    })
    await assert.rejects(service.getTrophies('A', 'trophy'), {
      code: 'PSN_INVALID_RESPONSE',
    })
  }
})

test('provider errors are sanitized and failed requests can be retried', async () => {
  let calls = 0
  const service = createTrophyService({
    auth,
    fetchDefinitions: async () => {
      if (calls++ === 0) throw new Error('private-token')
      return { trophies: [] }
    },
    fetchEarned: async () => ({ trophies: [] }),
  })
  await assert.rejects(
    service.getTrophies('A', 'trophy'),
    (error) =>
      error.code === 'PSN_FETCH_FAILED' &&
      !error.message.includes('private-token'),
  )
  assert.deepEqual((await service.getTrophies('A', 'trophy')).trophies, [])
})
