import RecentlyPlayed from '../components/RecentlyPlayed'
import NextSteps from '../components/NextSteps'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Game, GamesLoadState } from '../types'
import { gamePath } from '../routes'
type Props = {
  games: Game[]
  gamesLoadState: GamesLoadState
  activeGame: Game | undefined
  hasSavedHunt: boolean
  huntMessage: string
  updateActiveHunt: (game: Game | null) => void
}
export default function DashboardPage({
  games,
  gamesLoadState,
  activeGame,
  hasSavedHunt,
  huntMessage,
  updateActiveHunt,
}: Props) {
  const [failedCover, setFailedCover] = useState<string | null>(null)
  const hasCompleteTrophyData =
    gamesLoadState === 'success' &&
    games.every((game) => game.earnedTrophies !== null)

  const totalTrophies = games.reduce((total, game) => {
    if (game.earnedTrophies === null) {
      return total
    }
    return (
      total +
      game.earnedTrophies.bronze +
      game.earnedTrophies.silver +
      game.earnedTrophies.gold +
      game.earnedTrophies.platinum
    )
  }, 0)

  const totalPlatinums = games.reduce((total, game) => {
    if (game.earnedTrophies === null) {
      return total
    }

    return total + game.earnedTrophies.platinum
  }, 0)

  return (
    <>
      {' '}
      <section id="overview" aria-label="Library statistics">
        <div className="stats-grid">
          <article className="stat-card stat-library">
            <span className="stat-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="6" height="16" rx="1.5" />
                <rect x="12" y="4" width="9" height="16" rx="1.5" />
                <path d="M6 8v4m10-4h1" />
              </svg>
            </span>
            <h3>Games in library</h3>
            <p className="stat-value">
              {gamesLoadState === 'success' ? games.length : '—'}
            </p>
          </article>

          <article className="stat-card stat-trophies">
            <span className="stat-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v5m-4 3h8m-6-3h4" />
              </svg>
            </span>
            <h3>Trophies earned</h3>
            <p className="stat-value">
              {hasCompleteTrophyData ? totalTrophies : '—'}
            </p>
          </article>

          <article className="stat-card stat-platinum">
            <span className="stat-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 3h10v6a5 5 0 0 1-10 0V3ZM7 5H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4m-5 3v4m-4 3h8m-6-3h4" />
                <path
                  d="m12 5 .8 1.6 1.7.3-1.3 1.2.3 1.8-1.5-.8-1.5.8.3-1.8L9.5 6.9l1.7-.3L12 5Z"
                  strokeWidth="1"
                />
              </svg>
            </span>
            <h3>Platinums earned</h3>
            <p className="stat-value">
              {hasCompleteTrophyData ? totalPlatinums : '—'}
            </p>
          </article>
        </div>
      </section>
      <section id="active-hunt" aria-labelledby="hunt-title">
        <h2 id="hunt-title">Active hunt</h2>

        {activeGame ? (
          <div className="hunt-workspace">
            <article className="hunt-card">
              <div className="hunt-cover">
                {activeGame.iconUrl && activeGame.iconUrl !== failedCover ? (
                  <img
                    src={activeGame.iconUrl}
                    alt=""
                    onError={() => setFailedCover(activeGame.iconUrl)}
                  />
                ) : (
                  <span>Cover unavailable</span>
                )}
              </div>
              <div className="hunt-content">
                <p className="eyebrow">
                  {activeGame.platform ?? 'Unknown platform'} · ACTIVE HUNT
                </p>
                <h3>{activeGame.title}</h3>
                <div className="hunt-progress-label">
                  <span>Trophy progress</span>
                  <strong>
                    {activeGame.progress === null
                      ? 'Unavailable'
                      : `${activeGame.progress}%`}
                  </strong>
                </div>
                {activeGame.progress !== null && (
                  <progress
                    className="trophy-progress"
                    value={activeGame.progress}
                    max={100}
                    aria-label={`Trophy progress for ${activeGame.title}`}
                  />
                )}
                <p className="details-note">PSN progress · Includes DLC</p>
                <ul
                  className="hunt-counts"
                  aria-label="Earned trophies by type"
                >
                  {(['bronze', 'silver', 'gold', 'platinum'] as const).map(
                    (type) => (
                      <li key={type} className={`trophy-grade-${type}`}>
                        <span>{type}</span>
                        <strong>
                          {activeGame.earnedTrophies?.[type] ?? '—'}
                        </strong>
                      </li>
                    ),
                  )}
                </ul>
                <div className="hunt-actions">
                  <Link className="primary-button" to={gamePath(activeGame)}>
                    View trophies →
                  </Link>
                  <button
                    className="hunt-clear"
                    type="button"
                    onClick={() => updateActiveHunt(null)}
                  >
                    Clear active hunt
                  </button>
                </div>
              </div>
            </article>
            <NextSteps
              key={`${activeGame.serviceName}:${activeGame.id}`}
              game={activeGame}
            />
          </div>
        ) : (
          <p>
            {!hasSavedHunt
              ? 'No active hunt. Choose a game in My Library and select Set as active hunt.'
              : gamesLoadState === 'loading'
                ? 'Loading your saved hunt…'
                : gamesLoadState === 'error'
                  ? 'Could not load your saved hunt. Your selection is still saved; refresh to try again.'
                  : 'The saved game is not available in the current library. Choose another game or clear the hunt.'}
          </p>
        )}
        {hasSavedHunt && !activeGame && (
          <button
            className="primary-button"
            type="button"
            onClick={() => updateActiveHunt(null)}
          >
            Clear active hunt
          </button>
        )}
        <p className="hunt-message" role="status">
          {huntMessage}
        </p>
      </section>
      <RecentlyPlayed games={games} />
    </>
  )
}
