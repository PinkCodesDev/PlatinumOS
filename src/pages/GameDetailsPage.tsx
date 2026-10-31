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
    <>
      <PlatinumPlanner key={`${game.serviceName}:${game.id}`} game={game} />
      <GameDetails
        key={`${game.serviceName}:${game.id}`}
        game={game}
        onSetActiveHunt={onSetActiveHunt}
        isActiveHunt={
          activeHunt?.id === game.id &&
          activeHunt.serviceName === game.serviceName
        }
      />
      <p role="status">{huntMessage}</p>
    </>
  )
}
