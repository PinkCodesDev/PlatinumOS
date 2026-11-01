import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import PlatinumPlanner from './PlatinumPlanner'
import ProTips from './ProTips'
import { usePlatinumPlan } from '../hooks/usePlatinumPlan'
import { game } from '../test/fixtures'
import type { Game } from '../types'
function Workspace({ selected = game }: { selected?: Game }) {
  const plan = usePlatinumPlan(selected)
  return (
    <>
      <ProTips game={selected} plan={plan} />
      <PlatinumPlanner game={selected} plan={plan} />
    </>
  )
}
async function addStep(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText('New step'), text)
  await user.click(screen.getByRole('button', { name: 'Add step' }))
}
test('adds, edits, reorders and completes steps; restores them after remount', async () => {
  const user = userEvent.setup()
  const view = render(<Workspace />)
  await addStep(user, 'First mission')
  await addStep(user, 'Second mission')
  await user.click(
    screen.getByRole('button', { name: 'Edit step: First mission' }),
  )
  await user.clear(screen.getByLabelText('Edit step'))
  await user.type(screen.getByLabelText('Edit step'), 'Collect maps')
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(
    screen.getByRole('button', { name: 'Edit step: Collect maps' }),
  ).toHaveFocus()
  await user.click(
    screen.getByRole('button', { name: 'Move up: Second mission' }),
  )
  await user.click(screen.getByRole('checkbox', { name: 'Collect maps' }))
  view.unmount()
  render(<Workspace />)
  const list = within(
    screen.getByRole('region', { name: 'Platinum Planner' }),
  ).getAllByRole('listitem')
  expect(list[0]).toHaveTextContent('Second mission')
  expect(list[1]).toHaveTextContent('Collect maps')
  expect(screen.getByRole('checkbox', { name: 'Collect maps' })).toBeChecked()
  await user.click(
    screen.getByRole('button', { name: 'Delete step: Second mission' }),
  )
  expect(
    screen.queryByRole('checkbox', { name: 'Second mission' }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Edit step: Collect maps' }),
  ).toHaveFocus()
})
test('Escape cancels editing and returns focus without changing the step', async () => {
  const user = userEvent.setup()
  render(<Workspace />)
  await addStep(user, 'Keep me')
  await user.click(screen.getByRole('button', { name: 'Edit step: Keep me' }))
  await user.type(screen.getByLabelText('Edit step'), ' changed')
  await user.keyboard('{Escape}')
  expect(screen.getByRole('checkbox', { name: 'Keep me' })).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Edit step: Keep me' }),
  ).toHaveFocus()
})
test('persists tips and their plan link, prevents duplicates and isolates games', async () => {
  const user = userEvent.setup()
  let view = render(<Workspace />)
  await user.type(
    screen.getByLabelText('What should you remember?'),
    'Collect sync points',
  )
  await user.click(screen.getByRole('button', { name: 'Save tip' }))
  await user.click(
    screen.getByRole('button', { name: 'Add to plan: Collect sync points' }),
  )
  expect(
    screen.getByRole('button', {
      name: 'Already in plan: Collect sync points',
    }),
  ).toBeDisabled()
  view.unmount()
  view = render(<Workspace />)
  expect(
    screen.getByRole('button', {
      name: 'Already in plan: Collect sync points',
    }),
  ).toBeDisabled()
  expect(screen.getAllByRole('checkbox')).toHaveLength(1)
  await user.click(
    screen.getByRole('button', { name: 'Delete tip: Collect sync points' }),
  )
  expect(
    screen.getByRole('checkbox', { name: 'Collect sync points' }),
  ).toBeInTheDocument()
  view.unmount()
  render(<Workspace selected={{ ...game, id: 'OTHER' }} />)
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  expect(
    screen.getByText('No tips yet. Add your first reminder above.'),
  ).toBeInTheDocument()
})
test('retains changes on storage failure and saves on retry', async () => {
  const user = userEvent.setup()
  const view = render(<Workspace />)
  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('quota')
    })
  await addStep(user, 'Unsaved mission')
  expect(
    within(screen.getByRole('region', { name: 'Platinum Planner' })).getByRole(
      'alert',
    ),
  ).toHaveTextContent('could not be saved')
  expect(
    screen.getByRole('checkbox', { name: 'Unsaved mission' }),
  ).toBeInTheDocument()
  write.mockRestore()
  await user.click(screen.getByRole('button', { name: 'Save again' }))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  view.unmount()
  render(<Workspace />)
  expect(
    screen.getByRole('checkbox', { name: 'Unsaved mission' }),
  ).toBeInTheDocument()
})
test('malformed saved data shows warnings instead of crashing', () => {
  localStorage.setItem(
    `platinumos.planner.v1:${game.serviceName}:${game.id}`,
    '{broken',
  )
  localStorage.setItem(
    `platinumos.tips.v1:${game.serviceName}:${game.id}`,
    '[null]',
  )
  render(<Workspace />)
  expect(screen.getAllByRole('alert')).toHaveLength(3)
  expect(screen.getByLabelText('New step')).toBeEnabled()
})

test('tip storage failures can be retried without losing the note', async () => {
  const user = userEvent.setup()
  const view = render(<Workspace />)
  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('quota')
    })
  await user.type(
    screen.getByLabelText('What should you remember?'),
    'Keep this note',
  )
  await user.click(screen.getByRole('button', { name: 'Save tip' }))
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Changes could not be saved',
  )
  expect(screen.getByText('Keep this note')).toBeInTheDocument()
  write.mockRestore()
  await user.click(screen.getByRole('button', { name: 'Retry saving tips' }))
  view.unmount()
  render(<Workspace />)
  expect(screen.getByText('Keep this note')).toBeInTheDocument()
})
