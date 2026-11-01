import { useDataSource, storageKey } from '../data/source'
import { demoTips } from '../data/demo'
import { useRef, useState } from 'react'
import type { Game } from '../types'
import type { PlatinumPlan } from '../hooks/usePlatinumPlan'

type Tip = { id: string; text: string }
function readTips(
  key: string,
  fallback: Tip[],
): { tips: Tip[]; error: string } {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(key) ?? JSON.stringify(fallback),
    )
    if (
      !Array.isArray(data) ||
      !data.every(
        (tip) =>
          typeof tip?.id === 'string' &&
          typeof tip.text === 'string' &&
          tip.text.trim().length > 0 &&
          tip.text.length <= 200,
      ) ||
      new Set(data.map((tip) => tip.id)).size !== data.length
    )
      throw new Error('Invalid tips')
    return { tips: data, error: '' }
  } catch {
    return {
      tips: [],
      error:
        'Could not read saved tips. Saving changes will replace the previous tips.',
    }
  }
}

export default function ProTips({
  game,
  plan,
}: {
  game: Game
  plan: PlatinumPlan
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const source = useDataSource()
  const key = storageKey(source, `tips.v1:${game.serviceName}:${game.id}`)
  const [initial] = useState(() =>
    readTips(key, source === 'demo' && game.id === 'DEMO_1' ? demoTips : []),
  )
  const [tips, setTips] = useState(initial.tips)
  const [error, setError] = useState(initial.error)
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  function save(next: Tip[]) {
    setTips(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
      setError('')
      setMessage('Tips saved in this browser.')
    } catch {
      setMessage('')
      setError('Changes could not be saved. Keep this page open and try again.')
    }
  }
  return (
    <section className="pro-tips" aria-labelledby="pro-tips-title">
      <h3 id="pro-tips-title">Your pro tips</h3>
      <p>Your own reminders for {game.title}. Saved only in this browser.</p>
      <form
        className="tip-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!text.trim()) return
          save([...tips, { id: crypto.randomUUID(), text: text.trim() }])
          setText('')
        }}
      >
        <div className="library-field">
          <label htmlFor="tip-text">What should you remember?</label>
          <textarea
            id="tip-text"
            ref={inputRef}
            aria-describedby="tip-help"
            value={text}
            maxLength={200}
            rows={3}
            onChange={(event) => setText(event.target.value)}
            placeholder="While completing a mission, collect its optional items too…"
          />
        </div>
        <p id="tip-help" className="details-note">
          Up to 200 characters. Saved separately for this game.
        </p>
        <button
          type="submit"
          className="primary-button"
          disabled={!text.trim()}
        >
          Save tip
        </button>
      </form>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="primary-button secondary-button"
            onClick={() => save(tips)}
          >
            Retry saving tips
          </button>
        </div>
      )}
      <p role="status">{message}</p>
      {tips.length === 0 ? (
        <p>No tips yet. Add your first reminder above.</p>
      ) : (
        <ul className="tip-list">
          {tips.map((tip) => (
            <li key={tip.id}>
              <p>{tip.text}</p>
              <div className="tip-actions">
                <button
                  type="button"
                  className="primary-button secondary-button"
                  aria-label={`${plan.steps.some((step) => step.tipId === tip.id) ? 'Already in plan' : 'Add to plan'}: ${tip.text}`}
                  disabled={plan.steps.some((step) => step.tipId === tip.id)}
                  onClick={() => {
                    plan.addTip(tip.id, tip.text)
                    setMessage('Tip added to Planner.')
                  }}
                >
                  {plan.steps.some((step) => step.tipId === tip.id)
                    ? 'Already in plan'
                    : '+ Add to plan'}
                </button>
                <button
                  type="button"
                  className="primary-button secondary-button"
                  aria-label={`Delete tip: ${tip.text}`}
                  onClick={() => {
                    save(tips.filter((entry) => entry.id !== tip.id))
                    inputRef.current?.focus()
                  }}
                >
                  Delete tip
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="details-note">
        Adding a tip creates a separate Planner step. Deleting the tip keeps
        that step.
      </p>
      {plan.storageError && (
        <div role="alert">
          <p>{plan.storageError}</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => plan.savePlan(plan.steps)}
          >
            Retry saving plan
          </button>
        </div>
      )}
    </section>
  )
}
