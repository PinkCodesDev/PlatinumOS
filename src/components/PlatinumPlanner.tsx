import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Game } from '../types'

import type { PlatinumPlan } from '../hooks/usePlatinumPlan'

export default function PlatinumPlanner({
  game,
  plan,
}: {
  game: Game
  plan: PlatinumPlan
}) {
  const { steps, updateSteps, savePlan, message, storageError } = plan
  const [title, setTitle] = useState('')
  const completedCount = steps.filter((step) => step.completed).length

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
                <span>
                  {step.title}
                  {step.trophyId !== undefined && (
                    <small className="planner-source">
                      Linked to a PSN trophy
                    </small>
                  )}
                </span>
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
