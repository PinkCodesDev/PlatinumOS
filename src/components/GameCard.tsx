import { Link } from 'react-router-dom'
import { gamePath } from '../routes'
import { useState } from 'react'
import type { Game } from '../types'

type GameCardProps = {
  game: Game
}

function GameCard({ game }: GameCardProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const showCover = Boolean(game.iconUrl) && game.iconUrl !== failedImageUrl

  return (
    <article className="game-card">
      {showCover ? (
        <img
          className="game-card-cover"
          src={game.iconUrl ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setFailedImageUrl(game.iconUrl)}
        />
      ) : (
        <div className="game-card-cover game-card-cover-placeholder">
          Cover unavailable
        </div>
      )}
      <h3>{game.title}</h3>
      <p>{game.platform ?? 'Unknown platform'}</p>
      <p>
        {game.progress === null
          ? 'Progress unavailable'
          : `${game.progress}% complete`}
      </p>
      {game.progress !== null && (
        <progress
          className="trophy-progress"
          value={game.progress}
          max={100}
          aria-label={`Trophy progress for ${game.title}`}
        />
      )}
      <Link className="primary-button" to={gamePath(game)}>
        View details
      </Link>
    </article>
  )
}
export default GameCard
