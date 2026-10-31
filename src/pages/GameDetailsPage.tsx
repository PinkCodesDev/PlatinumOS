import { usePlatinumPlan } from '../hooks/usePlatinumPlan'
import PlatinumPlanner from '../components/PlatinumPlanner'
import { Link, useParams } from 'react-router-dom'
import type { Game, GamesLoadState } from '../types'
import GameDetails from '../components/GameDetails'

type Props = {
  games: Game[]
  gamesLoadState: GamesLoadState
  activeHunt: Pick<Game, 'id' | 'serviceName'> | null
  huntMessage: string
  onSetActiveHunt: (game: Game) => void
}

export default function GameDetailsPage({
  games,
  gamesLoadState,
  activeHunt,
  huntMessage,
  onSetActiveHunt,
}: Props) {
  const { gameId, serviceName } = useParams()
  if (
    !gameId ||
    !/^[A-Za-z0-9_-]{1,64}$/.test(gameId) ||
    (serviceName !== 'trophy' && serviceName !== 'trophy2')
  ) {
    return (
      <section>
        <h2>Invalid game address</h2>
        <Link to="/games">Back to library</Link>
      </section>
    )
  }
  if (gamesLoadState === 'loading')
    return <p role="status">Loading game details…</p>
  if (gamesLoadState === 'error')
    return (
      <section>
        <p role="alert">
          Could not load the library. Refresh the page to try again.
        </p>
        <Link to="/games">Back to library</Link>
      </section>
    )
  const game = games.find(
    (entry) => entry.id === gameId && entry.serviceName === serviceName,
  )
  if (!game)
    return (
      <section>
        <h2>Game not found</h2>
        <p>This game is not available in your current PSN library.</p>
        <Link to="/games">Back to library</Link>
      </section>
    )

  return (
    <GameWorkspace
      key={`${game.serviceName}:${game.id}`}
      game={game}
      activeHunt={activeHunt}
      huntMessage={huntMessage}
      onSetActiveHunt={onSetActiveHunt}
    />
  )
}

function GameWorkspace({
  game,
  activeHunt,
  huntMessage,
  onSetActiveHunt,
}: Pick<Props, 'activeHunt' | 'huntMessage' | 'onSetActiveHunt'> & {
  game: Game
}) {
  const plan = usePlatinumPlan(game)
  return (
    <>
      {game.serviceName === 'trophy' && game.id === 'NPWR06600_00' && (
        <section className="game-guide" aria-labelledby="guide-title">
          <h2 id="guide-title">Trophy guide</h2>
          <p>
            Plan your Assassin's Creed Unity platinum with this community guide
            on PSNProfiles.
          </p>
          <a
            className="primary-button"
            href="https://psnprofiles.com/guide/3324-assassins-creed-unity-trophy-guide"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open guide on PSNProfiles (new tab)
          </a>
          <p className="details-note">
            External community guide. The full guide is hosted on PSNProfiles.
          </p>
        </section>
      )}
      <PlatinumPlanner game={game} plan={plan} />
      <GameDetails
        key={`${game.serviceName}:${game.id}`}
        game={game}
        onSetActiveHunt={onSetActiveHunt}
        onAddToPlan={plan.addTrophy}
        plannedTrophyIds={plan.steps.flatMap((step) =>
          step.trophyId === undefined ? [] : [step.trophyId],
        )}
        isActiveHunt={
          activeHunt?.id === game.id &&
          activeHunt.serviceName === game.serviceName
        }
      />
      <p role="status">{huntMessage}</p>
    </>
  )
}
