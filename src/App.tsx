import { useEffect, useState } from 'react'

import './App.css'

import type { Game, GamesResponse } from './types'

function App() {
  const [games, setGames] = useState<Game[]>([])
  const [gamesStatus, setGamesStatus] = useState('Loading games…')

  useEffect(() => {
    const controller = new AbortController()

    async function loadGames() {
      try {
        const response = await fetch('/api/psn/games', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }

        const data: GamesResponse = await response.json()

        if (!Array.isArray(data.games)) {
          throw new Error('Invalid game list')
        }

        if (controller.signal.aborted) return
        setGames(data.games)
        setGamesStatus(
          data.games.length === 0
            ? 'No games found.'
            : `${data.games.length} games loaded from PSN`,
        )
      } catch {
        if (!controller.signal.aborted) {
          setGamesStatus('Could not load games. Check the backend and refresh.')
        }
      }
    }

    void loadGames()

    return () => controller.abort()
  }, [])

  const [serverStatus, setServerStatus] = useState('Checking server…')

  useEffect(() => {
    const controller = new AbortController()

    async function checkServer() {
      try {
        const response = await fetch('/api/health', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }

        const data: unknown = await response.json()

        if (
          typeof data !== 'object' ||
          data === null ||
          !('status' in data) ||
          data.status !== 'ok'
        ) {
          throw new Error('Unexpected server response')
        }

        setServerStatus('Server connected')
      } catch {
        if (!controller.signal.aborted) {
          setServerStatus('Server unavailable')
        }
      }
    }

    void checkServer()

    return () => controller.abort()
  }, [])

  const [activeGame, setActiveGame] = useState({
    title: 'Assassin’s Creed Unity',
    platform: 'PS4',
    status: 'In progress',
    earnedTrophies: 3,
    totalTrophies: 10,
  })

  const progress = Math.round(
    (activeGame.earnedTrophies / activeGame.totalTrophies) * 100,
  )

  function handleEarnTrophy() {
    setActiveGame((previousGame) => ({
      ...previousGame,
      earnedTrophies: Math.min(
        previousGame.earnedTrophies + 1,
        previousGame.totalTrophies,
      ),
    }))
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <a className="brand" href="/">
          PlatinumOS
        </a>

        <nav aria-label="Main navigation">
          <a href="#overview">Overview</a>
          <a href="#active-hunt">Active hunt</a>
          <a href="#library">My Library</a>
        </nav>

        <p className="sidebar-note">Your next platinum starts here.</p>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <p className="eyebrow">YOUR HUNTING HQ</p>
          <h1>Dashboard</h1>
          <p>Plan your hunts. Track your trophies. Earn your platinum.</p>
          <p role="status">{serverStatus}</p>
        </header>

        <section id="overview" aria-labelledby="overview-title">
          <h2 id="overview-title">Overview</h2>
          <p>Demo data — connect real progress later.</p>

          <div className="stats-grid">
            <article className="stat-card">
              <h3>Games in library</h3>
              <p className="stat-value">{games.length}</p>
            </article>

            <article className="stat-card">
              <h3>Trophies earned</h3>
              <p className="stat-value">{activeGame.earnedTrophies}</p>
            </article>

            <article className="stat-card">
              <h3>Platinums earned</h3>
              <p className="stat-value">0</p>
            </article>
          </div>
        </section>

        <section id="active-hunt" aria-labelledby="hunt-title">
          <h2 id="hunt-title">Active hunt</h2>

          <article className="game-card">
            <p className="eyebrow">
              {activeGame.platform} · {activeGame.status}
            </p>

            <h3>{activeGame.title}</h3>

            <p>
              {activeGame.earnedTrophies} / {activeGame.totalTrophies} trophies
              {' · '}
              {progress}% complete
            </p>

            <progress
              className="trophy-progress"
              value={activeGame.earnedTrophies}
              max={activeGame.totalTrophies}
              aria-label={`Trophy progress for ${activeGame.title}`}
            />

            <p>Demo data</p>
            <button
              className="primary-button"
              type="button"
              onClick={handleEarnTrophy}
              disabled={activeGame.earnedTrophies >= activeGame.totalTrophies}
            >
              Add demo trophy
            </button>
          </article>
        </section>
        <section id="library" aria-labelledby="library-title">
          <h2 id="library-title">My Library</h2>
          <p role="status">{gamesStatus}</p>

          <div className="stats-grid">
            {games.map((game) => (
              <article
                className="game-card"
                key={`${game.serviceName}:${game.id}`}
              >
                <p className="eyebrow">{game.platform ?? 'Unknown platform'}</p>
                <h3>{game.title}</h3>
                <p>
                  {game.progress === null
                    ? 'Progress unavailable'
                    : `${game.progress}% complete`}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
