import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import App from './App'
import { demoGames, demoTrophies } from './data/demo'
import { game } from './test/fixtures'
function open(path = '/') {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}
test('fresh demo has a populated hunt, plans and trophies without network requests', async () => {
  const user = userEvent.setup()
  const view = open()
  expect(
    await screen.findByRole('link', { name: 'Open Planner →' }),
  ).toBeInTheDocument()
  expect(screen.getByText('Demo profile · sample data')).toBeInTheDocument()
  await user.click(screen.getByRole('link', { name: 'Open Planner →' }))
  expect(screen.getAllByRole('checkbox')).toHaveLength(3)
  await user.type(screen.getByLabelText('New step'), 'My demo task')
  await user.click(screen.getByRole('button', { name: 'Add step' }))
  await user.click(screen.getByRole('tab', { name: 'Trophies' }))
  expect(
    await screen.findByRole('heading', { name: 'Hidden trophy' }),
  ).toBeInTheDocument()
  expect(screen.queryByText('The final guardian')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Reveal spoiler' }))
  expect(screen.getByText('The final guardian')).toBeInTheDocument()
  view.unmount()
  open('/games/trophy/DEMO_1#planner')
  expect(
    await screen.findByRole('checkbox', { name: 'My demo task' }),
  ).toBeInTheDocument()
  expect(fetch).not.toHaveBeenCalled()
})
test('reset restores demo defaults and preserves PSN and unrelated storage', async () => {
  const user = userEvent.setup()
  localStorage.setItem('platinumos.planner.v1:trophy:TEST_GAME', '[]')
  localStorage.setItem('unrelated', 'keep')
  const view = open('/games/trophy/DEMO_1#planner')
  await user.type(await screen.findByLabelText('New step'), 'Reset this task')
  await user.click(screen.getByRole('button', { name: 'Add step' }))
  await user.click(screen.getByRole('button', { name: 'Reset demo' }))
  await user.click(screen.getByRole('button', { name: 'Cancel reset' }))
  expect(
    screen.getByRole('checkbox', { name: 'Reset this task' }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Reset demo' }))
  await user.click(screen.getByRole('button', { name: 'Confirm reset' }))
  await user.click(await screen.findByRole('link', { name: 'Open Planner →' }))
  expect(
    screen.queryByRole('checkbox', { name: 'Reset this task' }),
  ).not.toBeInTheDocument()
  expect(screen.getAllByRole('checkbox')).toHaveLength(3)
  expect(localStorage.getItem('unrelated')).toBe('keep')
  expect(localStorage.getItem('platinumos.planner.v1:trophy:TEST_GAME')).toBe(
    '[]',
  )
  view.unmount()
  open('/games/trophy/DEMO_1#guide')
  expect(
    await screen.findByText(
      'Collect skill fragments during your first co-op run to avoid repeating missions later.',
    ),
  ).toBeInTheDocument()
})
test('switching sources replaces the library and restores separate saved active hunts', async () => {
  const user = userEvent.setup()
  localStorage.setItem(
    'platinumos.activeHunt.v1',
    JSON.stringify({ id: game.id, serviceName: game.serviceName }),
  )
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      if (path === '/api/health') return Response.json({ status: 'ok' })
      if (path === '/api/psn/games') return Response.json({ games: [game] })
      if (path === '/api/psn/recent') return Response.json({ games: [] })
      throw new Error('Unexpected request')
    }),
  )
  open()
  await screen.findByRole('link', { name: 'Open Planner →' })
  await user.selectOptions(screen.getByLabelText('Data source'), 'psn')
  expect(
    await screen.findByRole('heading', { name: game.title }),
  ).toBeInTheDocument()
  expect(localStorage.getItem('platinumos.source.v1')).toBe('psn')
  await user.selectOptions(screen.getByLabelText('Data source'), 'demo')
  const hunt = await screen.findByRole('region', { name: 'Active hunt' })
  expect(
    await within(hunt).findByRole('heading', { name: demoGames[0].title }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { name: game.title }),
  ).not.toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem('platinumos.activeHunt.v1')!)).toEqual(
    { id: game.id, serviceName: game.serviceName },
  )
})
test('demo trophy totals agree with the library statistics', () => {
  for (const entry of demoGames) {
    const trophies = demoTrophies[entry.id]
    expect(
      Object.values(entry.definedTrophies!).reduce((a, b) => a + b, 0),
    ).toBe(trophies.length)
    expect(
      Object.values(entry.earnedTrophies!).reduce((a, b) => a + b, 0),
    ).toBe(trophies.filter((t) => t.earned).length)
  }
})
