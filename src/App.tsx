import SidebarHunt from './components/SidebarHunt'
import { useEffect, useState } from 'react'

import './App.css'

import type {
  Game,
  GamesResponse,
  GamesLoadState,
  SortOrder,
  ProgressFilter,
} from './types'

import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import LibraryPage from './pages/LibraryPage'
import GameDetailsPage from './pages/GameDetailsPage'

const ACTIVE_HUNT_KEY = 'platinumos.activeHunt.v1'
type ActiveHunt = Pick<Game, 'id' | 'serviceName'>

function readActiveHunt(): ActiveHunt | null {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(ACTIVE_HUNT_KEY) ?? 'null',
    )
    if (
      typeof saved === 'object' &&
      saved !== null &&
      'id' in saved &&
      typeof saved.id === 'string' &&
      saved.id.length > 0 &&
      'serviceName' in saved &&
      (saved.serviceName === 'trophy' || saved.serviceName === 'trophy2')
    ) {
      return { id: saved.id, serviceName: saved.serviceName }
    }
  } catch {
    // Storage may be unavailable or contain invalid JSON.
  }
  return null
}

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

  const [activeHunt, setActiveHunt] = useState<ActiveHunt | null>(
    readActiveHunt,
  )
  const [huntMessage, setHuntMessage] = useState('')
  const activeGame = games.find(
    (game) =>
      game.id === activeHunt?.id && game.serviceName === activeHunt.serviceName,
  )

  function updateActiveHunt(game: Game | null) {
    const nextHunt = game
      ? { id: game.id, serviceName: game.serviceName }
      : null
    setActiveHunt(nextHunt)
    try {
      if (nextHunt)
        localStorage.setItem(ACTIVE_HUNT_KEY, JSON.stringify(nextHunt))
      else localStorage.removeItem(ACTIVE_HUNT_KEY)
      setHuntMessage(
        game ? 'Active hunt saved on this browser.' : 'Active hunt cleared.',
      )
    } catch {
      setHuntMessage(
        'Selection changed for this session, but browser storage is unavailable. It may not be restored correctly after a reload.',
      )
    }
  }

  const location = useLocation()
  const title =
    location.pathname === '/'
      ? 'Dashboard'
      : location.pathname === '/games'
        ? 'My Library'
        : location.pathname.startsWith('/games/')
          ? 'Game details'
          : 'Page not found'
  useEffect(() => {
    document.title = title + ' | PlatinumOS'
    window.scrollTo(0, 0)
  }, [location.pathname, title])

  if (location.pathname === '/' && location.hash === '#library')
    return <Navigate to="/games" replace />

  return (
    <div
      className={`dashboard${location.pathname === '/' ? ' dashboard-home' : ''}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="PlatinumOS — Dashboard">
          <img
            className="brand-mark"
            src="/platinumos-logo.png"
            alt=""
            width={80}
            height={80}
          />
          <span>
            Platinum<span className="brand-os">OS</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <p className="sidebar-label">Workspace</p>
          <NavLink to="/" end>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            Dashboard
          </NavLink>
          <NavLink to="/games">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="4" width="6" height="16" rx="1.5" />
              <rect x="12" y="4" width="9" height="16" rx="1.5" />
            </svg>
            My Library
          </NavLink>
        </nav>
        <SidebarHunt
          game={activeGame}
          loading={activeHunt !== null && gamesLoadState === 'loading'}
        />
        <a
          className="sidebar-repo"
          href="https://github.com/PinkCodesDev/PlatinumOS"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub <span aria-hidden="true">↗</span>
          <span className="sr-only"> (new tab)</span>
        </a>
      </aside>
      <main id="main-content" className="main-content" tabIndex={-1}>
        <header className="dashboard-header">
          <p className="eyebrow">TROPHY HUNTING MANAGER</p>
          <h1>{title}</h1>
          <p className="header-description">
            {location.pathname === '/'
              ? 'Your collection. Your next platinum.'
              : 'Plan your hunts. Track your trophies.'}
          </p>
          <p
            className="connection-status"
            data-connected={serverStatus === 'Server connected'}
            role="status"
          >
            {serverStatus}
          </p>
        </header>
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                games={games}
                gamesLoadState={gamesLoadState}
                activeGame={activeGame}
                hasSavedHunt={activeHunt !== null}
                huntMessage={huntMessage}
                updateActiveHunt={updateActiveHunt}
              />
            }
          />
          <Route
            path="/games"
            element={
              <LibraryPage
                games={games}
                gamesLoadState={gamesLoadState}
                gamesStatus={gamesStatus}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                progressFilter={progressFilter}
                setProgressFilter={setProgressFilter}
              />
            }
          />
          <Route
            path="/games/:serviceName/:gameId"
            element={
              <GameDetailsPage
                games={games}
                gamesLoadState={gamesLoadState}
                activeHunt={activeHunt}
                huntMessage={huntMessage}
                onSetActiveHunt={updateActiveHunt}
              />
            }
          />
          <Route
            path="*"
            element={
              <section>
                <h2>Page not found</h2>
                <p>This address does not exist.</p>
                <Link to="/games">Go to My Library</Link>
              </section>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
export default App
