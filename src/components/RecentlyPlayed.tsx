import { requestData } from '../data/api'
import { useDataSource } from '../data/source'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Game } from '../types'
import { gamePath } from '../routes'
type RecentGame = {
  title: string
  iconUrl: string | null
  platform: string
  lastPlayedAt: string
}
function RecentCard({ game, library }: { game: RecentGame; library: Game[] }) {
  const [failed, setFailed] = useState(false)
  const normalize = (name: string) =>
    name
      .replace(/[®™]/g, '')
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  const matches = library.filter(
    (item) =>
      normalize(item.title) === normalize(game.title) &&
      item.platform === game.platform,
  )
  const match = matches.length === 1 ? matches[0] : undefined
  return (
    <article className="recent-card">
      {game.iconUrl && !failed ? (
        <img
          src={game.iconUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="recent-cover-fallback">Cover unavailable</div>
      )}
      <div>
        <p className="eyebrow">{game.platform}</p>
        <h3>{game.title}</h3>
        <p className="details-note">
          Last played{' '}
          <time dateTime={game.lastPlayedAt}>
            {new Date(game.lastPlayedAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </time>
        </p>
        {match && <Link to={gamePath(match)}>View trophies →</Link>}
      </div>
    </article>
  )
}
export default function RecentlyPlayed({ games }: { games: Game[] }) {
  const source = useDataSource()
  const [result, setResult] = useState<{
    status: 'loading' | 'error' | 'success'
    games: RecentGame[]
  }>({ status: 'loading', games: [] })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const data = await requestData<{ games: RecentGame[] }>(
          source,
          '/api/psn/recent',
          controller.signal,
        )
        if (!Array.isArray(data.games)) throw new Error('Invalid')
        if (!controller.signal.aborted)
          setResult({ status: 'success', games: data.games })
      } catch {
        if (!controller.signal.aborted)
          setResult({ status: 'error', games: [] })
      }
    }
    void load()
    return () => controller.abort()
  }, [attempt, source])
  return (
    <section className="recently-played" aria-labelledby="recent-title">
      <div className="recent-heading">
        <div>
          <h2 id="recent-title">Recently played</h2>
          <p className="details-note">
            {source === 'demo'
              ? 'Sample gaming activity from the demo profile.'
              : 'Your latest gaming activity on PSN.'}
          </p>
        </div>
        <Link to="/games">View library →</Link>
      </div>
      {result.status === 'loading' && (
        <p role="status">Loading recently played games…</p>
      )}
      {result.status === 'error' && (
        <div role="alert">
          <p>Could not load recent activity from PSN.</p>
          <button
            className="primary-button secondary-button"
            onClick={() => {
              setResult({ status: 'loading', games: [] })
              setAttempt((value) => value + 1)
            }}
          >
            Try again
          </button>
        </div>
      )}
      {result.status === 'success' &&
        (result.games.length ? (
          <div className="recent-grid">
            {result.games.map((game) => (
              <RecentCard
                key={game.title + game.platform + game.lastPlayedAt}
                game={game}
                library={games}
              />
            ))}
          </div>
        ) : (
          <p className="details-note">No recent activity available.</p>
        ))}
    </section>
  )
}
