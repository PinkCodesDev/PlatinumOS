import { useEffect, useRef, useState } from 'react'
import type { Game, Trophy, TrophiesResponse } from '../types'

type Props = { game: Game; onClose: () => void }
type TrophyFilter = 'all' | 'earned' | 'missing'
type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; trophies: Trophy[] }

export default function GameDetails({ game, onClose }: Props) {
  const [result, setResult] = useState<LoadState>({ status: 'loading' })
  const [filter, setFilter] = useState<TrophyFilter>('all')
  const [attempt, setAttempt] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const query = new URLSearchParams({
          gameId: game.id,
          serviceName: game.serviceName,
        })
        const response = await fetch(`/api/psn/trophies?${query}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Could not load trophies')
        const data: TrophiesResponse = await response.json()
        if (
          !Array.isArray(data.trophies) ||
          data.gameId !== game.id ||
          data.serviceName !== game.serviceName
        )
          throw new Error('Invalid response')
        if (!controller.signal.aborted)
          setResult({ status: 'success', trophies: data.trophies })
      } catch {
        if (!controller.signal.aborted) setResult({ status: 'error' })
      }
    }
    void load()
    return () => controller.abort()
  }, [game.id, game.serviceName, attempt])

  const trophies = result.status === 'success' ? result.trophies : []
  const visibleTrophies = trophies.filter(
    (trophy) =>
      filter === 'all' ||
      (filter === 'earned' && trophy.earned === true) ||
      (filter === 'missing' && trophy.earned === false),
  )
  const earnedCount = trophies.filter((trophy) => trophy.earned === true).length
  const unknownCount = trophies.filter(
    (trophy) => trophy.earned === null,
  ).length

  return (
    <section className="game-details" aria-labelledby="game-details-title">
      <div className="game-details-header">
        <div>
          <p className="eyebrow">GAME DETAILS</p>
          <h2 id="game-details-title" ref={headingRef} tabIndex={-1}>
            {game.title}
          </h2>
          <p>
            {game.platform ?? 'Unknown platform'} ·{' '}
            {game.progress === null
              ? 'Progress unavailable'
              : `${game.progress}% complete`}
          </p>
        </div>
        <button className="primary-button" type="button" onClick={onClose}>
          Close details
        </button>
      </div>
      {game.progress !== null && (
        <progress
          className="trophy-progress"
          value={game.progress}
          max={100}
          aria-label={`Trophy progress for ${game.title}`}
        />
      )}
      <h3>Trophy Tracker</h3>
      <p className="details-note">
        All trophy groups, including DLC. Descriptions may contain spoilers.
      </p>
      {result.status === 'loading' && (
        <p role="status">Loading trophies from PSN…</p>
      )}
      {result.status === 'error' && (
        <div>
          <p role="alert">
            Could not load trophies. Check the backend and PSN connection.
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setResult({ status: 'loading' })
              setAttempt((previous) => previous + 1)
            }}
          >
            Try again
          </button>
        </div>
      )}
      {result.status === 'success' && (
        <>
          <p>
            {earnedCount} / {trophies.length} trophies earned
            {unknownCount > 0 ? ` · ${unknownCount} with unknown status` : ''}
          </p>
          <div className="library-field trophy-filter">
            <label htmlFor="trophy-filter">Show trophies</label>
            <select
              id="trophy-filter"
              value={filter}
              onChange={(event) => {
                const value = event.target.value
                if (
                  value === 'all' ||
                  value === 'earned' ||
                  value === 'missing'
                )
                  setFilter(value)
              }}
            >
              <option value="all">All trophies</option>
              <option value="earned">Earned</option>
              <option value="missing">Not earned</option>
            </select>
          </div>
          <p role="status">
            Showing {visibleTrophies.length} of {trophies.length} trophies
          </p>
          {trophies.length === 0 ? (
            <p>No trophies available for this game.</p>
          ) : visibleTrophies.length === 0 ? (
            <p>No trophies match this filter.</p>
          ) : (
            <ul className="trophy-list">
              {visibleTrophies.map((trophy) => (
                <li key={trophy.id}>
                  <div className="trophy-row-heading">
                    <h4>{trophy.name}</h4>
                    <span
                      className={`trophy-grade trophy-grade-${trophy.type}`}
                    >
                      {trophy.type}
                    </span>
                  </div>
                  <p>{trophy.description}</p>
                  <p className="details-note">
                    {trophy.earned === null
                      ? 'Status unavailable'
                      : trophy.earned
                        ? 'Earned'
                        : 'Not earned'}{' '}
                    ·{' '}
                    {trophy.groupId === 'default'
                      ? 'Base game'
                      : `Group ${trophy.groupId}`}
                  </p>
                  <p>
                    {trophy.earnedRate === null
                      ? 'Player completion rate unavailable'
                      : `${trophy.earnedRate}% of players earned this trophy`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
