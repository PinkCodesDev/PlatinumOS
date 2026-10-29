import { useEffect, useState } from 'react'

import './App.css'

import type { Game, GamesResponse } from './types'

import GameCard from './components/GameCard'

type GamesLoadState = 'loading' | 'success' | 'error'
type SortOrder = 'asc' | 'desc'
type ProgressFilter = 'all' | 'in-progress' | 'completed'

function App() {
  const [games, setGames] = useState<Game[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all')
  const [gamesLoadState, setGamesLoadState] =
    useState<GamesLoadState>('loading')
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
        setGamesLoadState('success')
        setGamesStatus(
          data.games.length === 0
            ? 'No games found.'
            : `${data.games.length} games loaded from PSN`,
        )
      } catch {
        if (!controller.signal.aborted) {
          setGamesLoadState('error')
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

  function handleEarnTrophy() {
    setActiveGame((previousGame) => ({
      ...previousGame,
      earnedTrophies: Math.min(
        previousGame.earnedTrophies + 1,
        previousGame.totalTrophies,
      ),
    }))
  }

  function handleClearSearch() {
    setSearchQuery('')
  }

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase())

    const matchesProgress =
      progressFilter === 'all' ||
      (progressFilter === 'in-progress' &&
        game.progress !== null &&
        game.progress > 0 &&
        game.progress < 100) ||
      (progressFilter === 'completed' && game.progress === 100)

    return matchesSearch && matchesProgress
  })

  const sortedGames = [...filteredGames].sort((a, b) => {
    const comparison = a.title.localeCompare(b.title)
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const hasNoSearchResults =
    gamesLoadState === 'success' &&
    games.length > 0 &&
    filteredGames.length === 0

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
          <div className="library-controls">
            <div className="library-field library-search">
              <label htmlFor="game-search">Search games</label>
              <input
                id="game-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Enter a game title"
              />
            </div>
            <button
              className="primary-button library-clear"
              type="button"
              onClick={handleClearSearch}
              disabled={searchQuery === ''}
            >
              Clear search
            </button>
            <div className="library-field">
              <label htmlFor="game-sort">Sort games</label>
              <select
                id="game-sort"
                value={sortOrder}
                onChange={(event) => {
                  const value = event.target.value
                  if (value === 'asc' || value === 'desc') {
                    setSortOrder(value)
                  }
                }}
              >
                <option value="asc">Title: A–Z</option>
                <option value="desc">Title: Z–A</option>
              </select>
            </div>
            <div className="library-field">
              <label htmlFor="game-progress">Filter by progress</label>
              <select
                id="game-progress"
                value={progressFilter}
                onChange={(event) => {
                  const value = event.target.value
                  if (
                    value === 'all' ||
                    value === 'in-progress' ||
                    value === 'completed'
                  ) {
                    setProgressFilter(value)
                  }
                }}
              >
                <option value="all">All games</option>
                <option value="in-progress">In progress</option>
                <option value="completed">100% complete</option>
              </select>
            </div>
          </div>
          <p className="library-status" role="status">
            {hasNoSearchResults
              ? 'No games match your search and filters.'
              : gamesStatus}
          </p>

          {gamesLoadState === 'success' && (
            <p>
              Showing {filteredGames.length} of {games.length} games
            </p>
          )}

          <div className="stats-grid">
            {sortedGames.map((game) => (
              <GameCard key={`${game.serviceName}:${game.id}`} game={game} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
