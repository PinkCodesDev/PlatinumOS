import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import type { Game, Trophy, TrophiesResponse } from '../types'

type Props = {
  game: Game
  onSetActiveHunt: (game: Game) => void
  isActiveHunt: boolean
  onAddToPlan: (trophy: Trophy) => void
  plannedTrophyIds: string[]
}
type TrophyFilter = 'all' | 'earned' | 'missing'
type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; trophies: Trophy[] }

function TrophyIcon({ iconUrl }: { iconUrl: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (!iconUrl || iconUrl === failedUrl) {
    return (
      <span className="trophy-icon trophy-icon-placeholder" aria-hidden="true">
        🏆
      </span>
    )
  }

  return (
    <img
      className="trophy-icon"
      src={iconUrl}
      alt=""
      width={64}
      height={64}
      loading="lazy"
      onError={() => setFailedUrl(iconUrl)}
    />
  )
}

export default function GameDetails({
  game,
  onSetActiveHunt,
  isActiveHunt,
  onAddToPlan,
  plannedTrophyIds,
}: Props) {
  const [result, setResult] = useState<LoadState>({ status: 'loading' })
  const [filter, setFilter] = useState<TrophyFilter>('all')
  const [typeFilter, setTypeFilter] = useState<Trophy['type'] | 'all'>('all')
  const [groupFilter, setGroupFilter] = useState('all')
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
  const groupIds = [...new Set(trophies.map((trophy) => trophy.groupId))].sort(
    (a, b) =>
      a === 'default'
        ? -1
        : b === 'default'
          ? 1
          : a.localeCompare(b, undefined, { numeric: true }),
  )
  const visibleTrophies = trophies.filter((trophy) => {
    const matchesStatus =
      filter === 'all' ||
      (filter === 'earned' && trophy.earned === true) ||
      (filter === 'missing' && trophy.earned === false)
    const matchesType = typeFilter === 'all' || trophy.type === typeFilter
    const matchesGroup = groupFilter === 'all' || trophy.groupId === groupFilter
    return matchesStatus && matchesType && matchesGroup
  })
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
        <Link className="primary-button" to="/games">
          Back to library
        </Link>
      </div>
      {game.progress !== null && (
        <progress
          className="trophy-progress"
          value={game.progress}
          max={100}
          aria-label={`Trophy progress for ${game.title}`}
        />
      )}
      <button
        className="primary-button"
        type="button"
        disabled={isActiveHunt}
        onClick={() => onSetActiveHunt(game)}
      >
        {isActiveHunt ? 'Current active hunt' : 'Set as active hunt'}
      </button>
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
          <div className="trophy-filters">
            <div className="library-field">
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
            <div className="library-field">
              <label htmlFor="trophy-type">Trophy type</label>
              <select
                id="trophy-type"
                value={typeFilter}
                onChange={(event) => {
                  const value = event.target.value
                  if (
                    value === 'all' ||
                    value === 'bronze' ||
                    value === 'silver' ||
                    value === 'gold' ||
                    value === 'platinum'
                  )
                    setTypeFilter(value)
                }}
              >
                <option value="all">All types</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
            <div className="library-field">
              <label htmlFor="trophy-group">Trophy group / DLC</label>
              <select
                id="trophy-group"
                value={groupFilter}
                onChange={(event) => setGroupFilter(event.target.value)}
              >
                <option value="all">All groups</option>
                {groupIds.map((id) => (
                  <option key={id} value={id}>
                    {id === 'default' ? 'Base game' : `DLC group ${id}`}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={
                filter === 'all' &&
                typeFilter === 'all' &&
                groupFilter === 'all'
              }
              onClick={() => {
                setFilter('all')
                setTypeFilter('all')
                setGroupFilter('all')
              }}
            >
              Reset filters
            </button>
          </div>
          <p role="status">
            Showing {visibleTrophies.length} of {trophies.length} trophies
          </p>
          {trophies.length === 0 ? (
            <p>No trophies available for this game.</p>
          ) : visibleTrophies.length === 0 ? (
            <p>No trophies match these filters.</p>
          ) : (
            <ul className="trophy-list">
              {visibleTrophies.map((trophy) => (
                <li key={trophy.id}>
                  <div className="trophy-row-heading">
                    <div className="trophy-title">
                      <TrophyIcon iconUrl={trophy.iconUrl} />
                      <h4>{trophy.name}</h4>
                    </div>
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
                  <button
                    className="primary-button"
                    type="button"
                    disabled={plannedTrophyIds.includes(trophy.id)}
                    onClick={() => onAddToPlan(trophy)}
                    aria-label={`${plannedTrophyIds.includes(trophy.id) ? 'Already in plan' : 'Add to plan'}: ${trophy.name}`}
                  >
                    {plannedTrophyIds.includes(trophy.id)
                      ? 'Already in plan'
                      : 'Add to plan'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
