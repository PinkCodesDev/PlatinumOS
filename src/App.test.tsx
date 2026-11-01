import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import App from './App'
import { game, trophies } from './test/fixtures'
function setupApi(games = [game], fail = false) {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/api/health') return Response.json({ status: 'ok' })
      if (url === '/api/psn/games')
        return fail
          ? new Response('', { status: 503 })
          : Response.json({ games })
      if (url === '/api/psn/recent') return Response.json({ games: [] })
      if (url.startsWith('/api/psn/trophies?'))
        return Response.json({
          gameId: game.id,
          serviceName: game.serviceName,
          trophies,
        })
      throw new Error('Unexpected request')
    }),
  )
}
function open(path = '/games') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}
test('library to active hunt, trophy and tip planning, dashboard completion and restoration', async () => {
  setupApi()
  const user = userEvent.setup()
  let view = open()
  await screen.findByRole('heading', { name: game.title })
  await user.type(screen.getByLabelText('Search games'), '  TEST  ')
  await user.click(screen.getByRole('link', { name: 'View details' }))
  await user.click(
    await screen.findByRole('button', { name: 'Set as active hunt' }),
  )
  await user.click(
    await screen.findByRole('button', { name: 'Add to plan: Explorer' }),
  )
  await user.click(screen.getByRole('tab', { name: 'Guide' }))
  await user.type(
    screen.getByLabelText('What should you remember?'),
    'QA reminder',
  )
  await user.click(screen.getByRole('button', { name: 'Save tip' }))
  await user.click(
    screen.getByRole('button', { name: 'Add to plan: QA reminder' }),
  )
  await user.click(screen.getByRole('tab', { name: /Planner/ }))
  expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  await user.click(screen.getByRole('link', { name: 'Dashboard' }))
  const next = await screen.findByRole('region', { name: 'Next steps' })
  await user.click(within(next).getByRole('checkbox', { name: 'QA reminder' }))
  expect(
    within(next).queryByRole('checkbox', { name: 'QA reminder' }),
  ).not.toBeInTheDocument()
  view.unmount()
  view = open('/')
  await screen.findByRole('link', { name: 'Open Planner →' })
  expect(
    screen.getByRole('button', { name: 'Clear active hunt' }),
  ).toBeInTheDocument()
  await user.click(await screen.findByRole('link', { name: 'Open Planner →' }))
  expect(
    await screen.findByRole('checkbox', { name: 'QA reminder' }),
  ).toBeChecked()
  expect(screen.getByRole('checkbox', { name: /Explorer/ })).not.toBeChecked()
  view.unmount()
})
test('empty library, unavailable API and unknown route have usable messages', async () => {
  setupApi([])
  let view = open()
  expect(await screen.findByText('No games found.')).toBeInTheDocument()
  view.unmount()
  setupApi([], true)
  view = open()
  expect(
    await screen.findByText(
      'Could not load games. Check the backend and refresh.',
    ),
  ).toBeInTheDocument()
  view.unmount()
  open('/not-a-page')
  expect(
    screen.getByRole('heading', { name: 'Page not found', level: 2 }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Go to My Library' }),
  ).toBeInTheDocument()
})
test('game tabs support keyboard navigation without losing form drafts', async () => {
  setupApi()
  open(`/games/${game.serviceName}/${game.id}#planner`)
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('New step'), 'Unfinished draft')
  await user.click(screen.getByRole('tab', { name: /Planner/ }))
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: 'Guide' })).toHaveFocus()
  expect(screen.getByRole('tab', { name: 'Guide' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await user.keyboard('{ArrowLeft}')
  expect(screen.getByLabelText('New step')).toHaveValue('Unfinished draft')
  await user.click(screen.getByRole('link', { name: 'Skip to content' }))
  expect(screen.getByRole('main')).toHaveFocus()
  expect(screen.getByRole('tab', { name: /Planner/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})
