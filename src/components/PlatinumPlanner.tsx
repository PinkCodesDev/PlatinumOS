import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Game } from '../types'

type PlanStep = { id: string; title: string; completed: boolean }
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
          typeof step.completed === 'boolean',
      ) ||
      new Set(data.map((step) => step.id)).size !== data.length
    ) {
      throw new Error('Invalid plan')
    }
    return {
      steps: data.map(({ id, title, completed }) => ({ id, title, completed })),
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

export default function PlatinumPlanner({ game }: { game: Game }) {
  const storageKey = `platinumos.planner.v1:${game.serviceName}:${game.id}`
  const [initialPlan] = useState(() => readPlan(storageKey))
  const [steps, setSteps] = useState<PlanStep[]>(initialPlan.steps)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [storageError, setStorageError] = useState(initialPlan.warning)
  const completedCount = steps.filter((step) => step.completed).length

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
    setSteps(nextSteps)
    savePlan(nextSteps)
  }

  function addStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle || trimmedTitle.length > 200) return
    updateSteps([
      ...steps,
      { id: crypto.randomUUID(), title: trimmedTitle, completed: false },
    ])
    setTitle('')
  }

  return (
    <section className="platinum-planner" aria-labelledby="planner-title">
      <h2 id="planner-title">Platinum Planner</h2>
      <p>
        Your plan for <strong>{game.title}</strong>. Checking a step does not
        change your PSN trophies.
      </p>
      <form className="planner-form" onSubmit={addStep}>
        <div className="library-field">
          <label htmlFor="plan-step">New step</label>
          <input
            id="plan-step"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            placeholder="e.g. Collect sync points during co-op missions"
            required
          />
        </div>
        <button
          className="primary-button"
          type="submit"
          disabled={!title.trim()}
        >
          Add step
        </button>
      </form>
      <p>
        {completedCount} / {steps.length} steps completed
      </p>
      {steps.length > 0 && (
        <progress
          className="trophy-progress"
          value={completedCount}
          max={steps.length}
          aria-label={`Plan progress for ${game.title}`}
        />
      )}
      {steps.length === 0 ? (
        <p className="details-note">
          No steps yet. Add your first task to start planning.
        </p>
      ) : (
        <ul className="planner-list">
          {steps.map((step) => (
            <li key={step.id}>
              <label
                className={
                  step.completed ? 'planner-step is-completed' : 'planner-step'
                }
              >
                <input
                  type="checkbox"
                  checked={step.completed}
                  onChange={() =>
                    updateSteps(
                      steps.map((item) =>
                        item.id === step.id
                          ? { ...item, completed: !item.completed }
                          : item,
                      ),
                    )
                  }
                />
                <span>{step.title}</span>
              </label>
              <button
                className="primary-button"
                type="button"
                aria-label={`Delete step: ${step.title}`}
                onClick={() =>
                  updateSteps(steps.filter((item) => item.id !== step.id))
                }
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="details-note">
        Saved locally in this browser, separately for each game. Clearing
        browser data removes your plans.
      </p>
      <p role="status">{message}</p>
      {storageError && (
        <div role="alert">
          <p>{storageError}</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => savePlan(steps)}
          >
            Save again
          </button>
        </div>
      )}
    </section>
  )
}
