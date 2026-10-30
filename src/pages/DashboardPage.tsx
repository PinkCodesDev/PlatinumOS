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
      <section id="overview" aria-labelledby="overview-title">
        <h2 id="overview-title">Overview</h2>
        <p>Statistics from your PSN library.</p>

        <div className="stats-grid">
          <article className="stat-card">
            <h3>Games in library</h3>
            <p className="stat-value">
              {gamesLoadState === 'success' ? games.length : '—'}
            </p>
          </article>

          <article className="stat-card">
            <h3>Trophies earned</h3>
            <p className="stat-value">
              {hasCompleteTrophyData ? totalTrophies : '—'}
            </p>
          </article>

          <article className="stat-card">
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
          <article className="game-card">
            <p className="eyebrow">
              {activeGame.platform ?? 'Unknown platform'} · ACTIVE HUNT
            </p>
            <h3>{activeGame.title}</h3>
            <p>
              {activeGame.progress === null
                ? 'Progress unavailable'
                : `${activeGame.progress}% complete`}
            </p>
            {activeGame.progress !== null && (
              <progress
                className="trophy-progress"
                value={activeGame.progress}
                max={100}
                aria-label={`Trophy progress for ${activeGame.title}`}
              />
            )}
            <p>Progress from PSN · includes additional trophy groups.</p>
            <Link className="primary-button" to={gamePath(activeGame)}>
              View trophies
            </Link>
          </article>
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
        {hasSavedHunt && (
          <button
            className="primary-button"
            type="button"
            onClick={() => updateActiveHunt(null)}
          >
            Clear active hunt
          </button>
        )}
        <p role="status">{huntMessage}</p>
      </section>
    </>
  )
}
