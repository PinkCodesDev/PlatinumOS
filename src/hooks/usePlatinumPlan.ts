import { useRef, useState } from 'react'
import type { Game, Trophy } from '../types'
export type PlanStep = {
  id: string
  title: string
  completed: boolean
  trophyId?: string
}
type SavedPlan = { steps: PlanStep[]; warning: string }

function readPlan(key: string): SavedPlan {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return { steps: [], warning: '' }
    const data: unknown = JSON.parse(raw)
    if (
      !Array.isArray(data) ||
      !data.every(
        (step) =>
          typeof step === 'object' &&
          step !== null &&
          typeof step.id === 'string' &&
          step.id.length > 0 &&
          typeof step.title === 'string' &&
          step.title.trim().length > 0 &&
          step.title.length <= 200 &&
          typeof step.completed === 'boolean' &&
          (step.trophyId === undefined ||
            (typeof step.trophyId === 'string' && step.trophyId.length > 0)),
      ) ||
      new Set(data.map((step) => step.id)).size !== data.length
    ) {
      throw new Error('Invalid plan')
    }
    return {
      steps: data.map(({ id, title, completed, trophyId }) => ({
        id,
        title,
        completed,
        ...(trophyId === undefined ? {} : { trophyId }),
      })),
      warning: '',
    }
  } catch {
    return {
      steps: [],
      warning:
        'Could not read the saved plan. Changes will replace the previous plan if saving is available.',
    }
  }
}

export function usePlatinumPlan(game: Game) {
  const storageKey = `platinumos.planner.v1:${game.serviceName}:${game.id}`
  const [initialPlan] = useState(() => readPlan(storageKey))
  const [steps, setSteps] = useState<PlanStep[]>(initialPlan.steps)
  const [message, setMessage] = useState('')
  const [storageError, setStorageError] = useState(initialPlan.warning)
  const stepsRef = useRef(steps)

  function savePlan(nextSteps: PlanStep[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextSteps))
      setStorageError('')
      setMessage('Plan saved in this browser.')
    } catch {
      setStorageError(
        'Changes are visible, but could not be saved. Keep this page open and try saving again.',
      )
      setMessage('')
    }
  }

  function updateSteps(nextSteps: PlanStep[]) {
    stepsRef.current = nextSteps
    setSteps(nextSteps)
    savePlan(nextSteps)
  }

  function addTrophy(trophy: Trophy) {
    if (stepsRef.current.some((step) => step.trophyId === trophy.id)) return
    updateSteps([
      ...stepsRef.current,
      {
        id: crypto.randomUUID(),
        title: trophy.name.trim().slice(0, 200) || 'Trophy task',
        completed: false,
        trophyId: trophy.id,
      },
    ])
    setMessage('Trophy added to your plan.')
  }
  return { steps, updateSteps, savePlan, message, storageError, addTrophy }
}
export type PlatinumPlan = ReturnType<typeof usePlatinumPlan>
