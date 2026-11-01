import { requestData } from '../data/api'
import { useDataSource } from '../data/source'
import { useEffect, useState } from 'react'
import type { Game, Trophy, TrophiesResponse } from '../types'

type Props = {
  game: Game
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
  onAddToPlan,
  plannedTrophyIds,
}: Props) {
  const source = useDataSource()
  const [result, setResult] = useState<LoadState>({ status: 'loading' })
  const [revealedIds, setRevealedIds] = useState<string[]>([])
  function isConcealed(trophy: Trophy) {
    return (
      trophy.hidden &&
      trophy.earned !== true &&
      !revealedIds.includes(trophy.id)
    )
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<TrophyFilter>('all')
  const [typeFilter, setTypeFilter] = useState<Trophy['type'] | 'all'>('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const query = new URLSearchParams({
          gameId: game.id,
          serviceName: game.serviceName,
        })
        const data = await requestData<TrophiesResponse>(
          source,
          `/api/psn/trophies?${query}`,
          controller.signal,
        )
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
  }, [game.id, game.serviceName, attempt, source])

  const trophies = result.status === 'success' ? result.trophies : []
  const groupIds = [...new Set(trophies.map((trophy) => trophy.groupId))].sort(
    (a, b) =>
      a === 'default'
        ? -1
        : b === 'default'
          ? 1
          : a.localeCompare(b, undefined, { numeric: true }),
  )
  function groupLabel(id: string) {
    if (id === 'default') return 'Base game'
    return (
      trophies.find((trophy) => trophy.groupId === id && trophy.groupName)
        ?.groupName ?? `Unnamed DLC (${id})`
    )
  }
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleTrophies = trophies.filter((trophy) => {
    const matchesStatus =
      filter === 'all' ||
      (filter === 'earned' && trophy.earned === true) ||
      (filter === 'missing' && trophy.earned === false)
    const matchesType = typeFilter === 'all' || trophy.type === typeFilter
    const matchesGroup = groupFilter === 'all' || trophy.groupId === groupFilter
    const matchesSearch =
      normalizedQuery === '' ||
      (!isConcealed(trophy) &&
        (trophy.name.toLowerCase().includes(normalizedQuery) ||
          trophy.description.toLowerCase().includes(normalizedQuery)))
    return matchesStatus && matchesType && matchesGroup && matchesSearch
  })
  const earnedCount = trophies.filter((trophy) => trophy.earned === true).length
  const unknownCount = trophies.filter(
    (trophy) => trophy.earned === null,
  ).length

  return (
    <section className="game-details" aria-labelledby="tracker">
      <h3 id="tracker" tabIndex={-1}>
        Trophy Tracker
      </h3>
      <p className="details-note">
        Hidden, unearned trophies are concealed until you reveal them. Search
        only checks revealed details. Other descriptions may contain spoilers.
      </p>
      {result.status === 'loading' && <p role="status">Loading trophies…</p>}
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
            <div className="library-field trophy-search">
              <label htmlFor="trophy-search">Search trophies</label>
              <input
                id="trophy-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or description"
              />
            </div>
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
                    {groupLabel(id)}
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
                groupFilter === 'all' &&
                searchQuery === ''
              }
              onClick={() => {
                setSearchQuery('')
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
            <p>No trophies match your search and filters.</p>
          ) : (
            <ul className="trophy-list">
              {visibleTrophies.map((trophy) => (
                <li key={trophy.id} className="trophy-item">
                  <TrophyIcon
                    iconUrl={isConcealed(trophy) ? null : trophy.iconUrl}
                  />
                  <div className="trophy-copy">
                    <h4>
                      {isConcealed(trophy) ? 'Hidden trophy' : trophy.name}
                    </h4>
                    <p>
                      {isConcealed(trophy)
                        ? 'Reveal this trophy to see its requirements.'
                        : trophy.description}
                    </p>
                    {trophy.hidden && trophy.earned !== true && (
                      <button
                        type="button"
                        className="primary-button secondary-button"
                        onClick={() =>
                          setRevealedIds((ids) =>
                            ids.includes(trophy.id)
                              ? ids.filter((id) => id !== trophy.id)
                              : [...ids, trophy.id],
                          )
                        }
                      >
                        {isConcealed(trophy)
                          ? 'Reveal spoiler'
                          : 'Hide spoiler'}
                      </button>
                    )}
                    <div className="trophy-meta">
                      <span
                        className={
                          trophy.earned === true
                            ? 'trophy-status is-earned'
                            : 'trophy-status'
                        }
                      >
                        {trophy.earned === null
                          ? 'Status unavailable'
                          : trophy.earned
                            ? '✓ Earned'
                            : 'Not earned'}
                      </span>
                      <span>{groupLabel(trophy.groupId)}</span>
                    </div>
                  </div>
                  <div className="trophy-actions">
                    <span
                      className={`trophy-grade trophy-grade-${trophy.type}`}
                    >
                      {trophy.type}
                    </span>
                    <p
                      className="trophy-rarity"
                      title="Percentage of PSN players who earned this trophy"
                    >
                      {trophy.earnedRate === null
                        ? 'Rarity unavailable'
                        : `${trophy.earnedRate}% of players`}
                    </p>
                    <button
                      className="primary-button secondary-button"
                      type="button"
                      disabled={
                        isConcealed(trophy) ||
                        plannedTrophyIds.includes(trophy.id)
                      }
                      onClick={() => onAddToPlan(trophy)}
                      aria-label={`${plannedTrophyIds.includes(trophy.id) ? 'Already in plan' : 'Add to plan'}: ${isConcealed(trophy) ? 'Hidden trophy' : trophy.name}`}
                    >
                      {plannedTrophyIds.includes(trophy.id)
                        ? 'Already in plan'
                        : '+ Add to plan'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
