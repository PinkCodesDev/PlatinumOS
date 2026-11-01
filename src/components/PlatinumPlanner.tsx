import { useEffect, useRef, useState } from 'react'
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const pendingFocus = useRef<string | null>(null)
  useEffect(() => {
    if (pendingFocus.current) {
      document.getElementById(pendingFocus.current)?.focus()
      pendingFocus.current = null
    }
  }, [editingId, steps])
  function finishEditing() {
    pendingFocus.current = 'edit-button-' + editingId
    setEditingId(null)
  }
  function deleteStep(id: string, index: number) {
    const next = steps[index + 1] ?? steps[index - 1]
    pendingFocus.current = next ? 'edit-button-' + next.id : 'plan-step'
    updateSteps(steps.filter((step) => step.id !== id))
  }
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

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextTitle = draftTitle.trim()
    if (!nextTitle || nextTitle.length > 200) return
    updateSteps(
      steps.map((step) =>
        step.id === editingId ? { ...step, title: nextTitle } : step,
      ),
    )
    finishEditing()
  }

  function moveStep(id: string, direction: -1 | 1) {
    const index = steps.findIndex((step) => step.id === id)
    const targetIndex = index + direction
    if (index < 0 || targetIndex < 0 || targetIndex >= steps.length) return
    const nextSteps = [...steps]
    ;[nextSteps[index], nextSteps[targetIndex]] = [
      nextSteps[targetIndex],
      nextSteps[index],
    ]
    pendingFocus.current = 'edit-button-' + id
    updateSteps(nextSteps)
  }

  return (
    <section
      id="planner"
      tabIndex={-1}
      className="platinum-planner"
      aria-labelledby="planner-title"
    >
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
      <p role="status" aria-atomic="true">
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
          {steps.map((step, index) => (
            <li key={step.id}>
              {editingId === step.id ? (
                <form
                  className="planner-edit-form"
                  onSubmit={saveEdit}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      finishEditing()
                    }
                  }}
                >
                  <div className="library-field">
                    <label htmlFor={`edit-step-${step.id}`}>Edit step</label>
                    <input
                      id={`edit-step-${step.id}`}
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      maxLength={200}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="planner-actions">
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={!draftTitle.trim()}
                    >
                      Save
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={finishEditing}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <label
                  className={
                    step.completed
                      ? 'planner-step is-completed'
                      : 'planner-step'
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
              )}
              <div className="planner-actions">
                <button
                  className="primary-button"
                  type="button"
                  disabled={editingId !== null}
                  id={`edit-button-${step.id}`}
                  aria-label={`Edit step: ${step.title}`}
                  onClick={() => {
                    setEditingId(step.id)
                    setDraftTitle(step.title)
                  }}
                >
                  Edit
                </button>
                <button
                  className="primary-button"
                  type="button"
                  disabled={index === 0 || editingId !== null}
                  aria-label={`Move up: ${step.title}`}
                  onClick={() => moveStep(step.id, -1)}
                >
                  ↑ Up
                </button>
                <button
                  className="primary-button"
                  type="button"
                  disabled={index === steps.length - 1 || editingId !== null}
                  aria-label={`Move down: ${step.title}`}
                  onClick={() => moveStep(step.id, 1)}
                >
                  ↓ Down
                </button>
                <button
                  className="primary-button"
                  type="button"
                  disabled={editingId !== null}
                  aria-label={`Delete step: ${step.title}`}
                  onClick={() => deleteStep(step.id, index)}
                >
                  Delete
                </button>
              </div>
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
