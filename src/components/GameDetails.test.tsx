import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import GameDetails from './GameDetails'
import { game, trophies } from '../test/fixtures'
function response() {
  return new Response(
    JSON.stringify({
      gameId: game.id,
      serviceName: game.serviceName,
      trophies,
    }),
  )
}
async function setup() {
  const fetchMock = vi.fn().mockResolvedValue(response())
  vi.stubGlobal('fetch', fetchMock)
  const add = vi.fn()
  render(<GameDetails game={game} onAddToPlan={add} plannedTrophyIds={[]} />)
  await screen.findByRole('heading', { name: 'Explorer' })
  return { user: userEvent.setup(), add, fetchMock }
}
test('searches descriptions ignoring case and outer spaces without refetching', async () => {
  const { user, fetchMock } = await setup()
  await user.type(screen.getByRole('searchbox'), '  MAPS  ')
  expect(screen.getByRole('heading', { name: 'Explorer' })).toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { name: 'DLC explorer' }),
  ).not.toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
test('combines search, type, status and DLC filters; reset restores everything', async () => {
  const { user } = await setup()
  await user.type(screen.getByRole('searchbox'), 'explorer')
  await user.selectOptions(screen.getByLabelText('Show trophies'), 'missing')
  await user.selectOptions(screen.getByLabelText('Trophy type'), 'gold')
  await user.selectOptions(screen.getByLabelText('Trophy group / DLC'), '001')
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
  expect(
    screen.getByRole('heading', { name: 'DLC explorer' }),
  ).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Trophy type'), 'silver')
  expect(
    screen.getByText('No trophies match your search and filters.'),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Reset filters' }))
  expect(screen.getAllByRole('listitem')).toHaveLength(4)
  expect(screen.getByRole('searchbox')).toHaveValue('')
  expect(screen.getByRole('button', { name: 'Reset filters' })).toBeDisabled()
})
test('conceals spoiler text and image, excludes search matches until revealed', async () => {
  const { user, add } = await setup()
  expect(screen.queryByText('Secret ending')).not.toBeInTheDocument()
  expect(
    document.querySelector('img[src="https://example.test/secret.png"]'),
  ).toBeNull()
  expect(
    screen.getByRole('button', { name: 'Add to plan: Hidden trophy' }),
  ).toBeDisabled()
  await user.type(screen.getByRole('searchbox'), 'Secret ending')
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  await user.clear(screen.getByRole('searchbox'))
  await user.click(screen.getByRole('button', { name: 'Reveal spoiler' }))
  await user.click(
    screen.getByRole('button', { name: 'Add to plan: Secret ending' }),
  )
  expect(add).toHaveBeenCalledWith(trophies[2])
  await user.click(screen.getByRole('button', { name: 'Hide spoiler' }))
  expect(screen.queryByText('Defeat the king')).not.toBeInTheDocument()
})
test('unknown earned status is not treated as missing', async () => {
  const { user } = await setup()
  await user.selectOptions(screen.getByLabelText('Show trophies'), 'missing')
  expect(
    screen.queryByRole('heading', { name: 'Unknown explorer' }),
  ).not.toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
})
test('offers retry after API failure and recovers', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(response()),
  )
  render(
    <GameDetails game={game} onAddToPlan={vi.fn()} plannedTrophyIds={['1']} />,
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not load trophies',
  )
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Try again' }))
  await screen.findByRole('heading', { name: 'Explorer' })
  expect(
    screen.getByRole('button', { name: 'Already in plan: Explorer' }),
  ).toBeDisabled()
  expect(
    within(screen.getByRole('list')).getAllByRole('listitem'),
  ).toHaveLength(4)
})

test('earned hidden trophies are visible without revealing spoilers', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          gameId: game.id,
          serviceName: game.serviceName,
          trophies: [{ ...trophies[2], earned: true }],
        }),
      ),
    ),
  )
  render(
    <GameDetails game={game} onAddToPlan={vi.fn()} plannedTrophyIds={[]} />,
  )
  expect(
    await screen.findByRole('heading', { name: 'Secret ending' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Reveal spoiler' }),
  ).not.toBeInTheDocument()
})
