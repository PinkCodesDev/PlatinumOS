import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Game } from '../types'
import { gamePath } from '../routes'

export default function SidebarHunt({
  game,
  loading,
}: {
  game?: Game
  loading: boolean
}) {
  const [failedCover, setFailedCover] = useState<string | null>(null)
  return (
    <section className="sidebar-hunt" aria-labelledby="sidebar-hunt-title">
      <h2 id="sidebar-hunt-title">Current hunt</h2>
      {game ? (
        <>
          <div className="sidebar-hunt-game">
            {game.iconUrl && failedCover !== game.iconUrl ? (
              <img
                src={game.iconUrl}
                alt=""
                width={44}
                height={44}
                onError={() => setFailedCover(game.iconUrl)}
              />
            ) : (
              <span className="sidebar-cover-fallback" aria-hidden="true">
                ★
              </span>
            )}
            <span>{game.title}</span>
          </div>
          <p className="sidebar-hunt-progress">
            {game.progress === null
              ? 'Progress unavailable'
              : game.progress + '% complete'}
            <span>Includes DLC</span>
          </p>
          {game.progress !== null && (
            <progress
              className="trophy-progress"
              value={game.progress}
              max={100}
              aria-label={`Trophy progress for ${game.title}`}
            />
          )}
          <Link to={gamePath(game) + '#tracker'}>
            Trophy Tracker <span aria-hidden="true">→</span>
          </Link>
          <Link to={gamePath(game) + '#planner'}>
            Platinum Planner <span aria-hidden="true">→</span>
          </Link>
        </>
      ) : loading ? (
        <p className="details-note">Loading your hunt…</p>
      ) : (
        <Link to="/games">Choose your next hunt →</Link>
      )}
    </section>
  )
}
