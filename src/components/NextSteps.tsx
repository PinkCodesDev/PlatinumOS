import { Link } from 'react-router-dom'
import type { Game } from '../types'
import { usePlatinumPlan } from '../hooks/usePlatinumPlan'
import { gamePath } from '../routes'

export default function NextSteps({ game }: { game: Game }) {
  const { steps, updateSteps, savePlan, storageError, message } =
    usePlatinumPlan(game)
  const pending = steps.filter((step) => !step.completed)
  const nextSteps = pending.slice(0, 3)
  return (
    <section className="next-steps" aria-labelledby="next-steps-title">
      <p className="eyebrow">YOUR PLAN</p>
      <h3 id="next-steps-title">Next steps</h3>
      <p className="details-note">
        {steps.length - pending.length} / {steps.length} completed
      </p>
      {nextSteps.length > 0 ? (
        <ul>
          {nextSteps.map((step) => (
            <li key={step.id}>
              <label>
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() =>
                    updateSteps(
                      steps.map((item) =>
                        item.id === step.id
                          ? { ...item, completed: true }
                          : item,
                      ),
                    )
                  }
                />
                <span>{step.title}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="details-note">
          {steps.length
            ? 'All steps completed. Ready for your next goal?'
            : 'No steps yet. Add your first goal in the Planner.'}
        </p>
      )}
      {pending.length > 3 && (
        <p className="details-note">{pending.length - 3} more in your plan</p>
      )}
      <Link
        className="primary-button secondary-button"
        to={gamePath(game) + '#planner'}
      >
        Open Planner →
      </Link>
      <p className="details-note" role="status">
        {message}
      </p>
      {storageError && (
        <div role="alert">
          <p>{storageError}</p>
          <button className="primary-button" onClick={() => savePlan(steps)}>
            Save again
          </button>
        </div>
      )}
    </section>
  )
}
