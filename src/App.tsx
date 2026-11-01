import { DataSourceContext, storageKey, useDataSource } from './data/source'
import type { DataSource } from './data/source'
import { requestData } from './data/api'
import { useNavigate } from 'react-router-dom'
import SidebarHunt from './components/SidebarHunt'
import { useEffect, useRef, useState } from 'react'

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

type ActiveHunt = Pick<Game, 'id' | 'serviceName'>

function readActiveHunt(key: string, source: DataSource): ActiveHunt | null {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(key) ??
        (source === 'demo' ? '{"id":"DEMO_1","serviceName":"trophy"}' : 'null'),
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

function AppContent() {
  const source = useDataSource()
  const ACTIVE_HUNT_KEY = storageKey(source, 'activeHunt.v1')
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
        const data = await requestData<GamesResponse>(
          source,
          '/api/psn/games',
          controller.signal,
        )

        if (!Array.isArray(data.games)) {
          throw new Error('Invalid game list')
        }

        if (controller.signal.aborted) return
        setGames(data.games)
        setGamesLoadState('success')
        setGamesStatus(
          data.games.length === 0
            ? 'No games found.'
            : `${data.games.length} games loaded from ${source === 'demo' ? 'demo profile' : 'PSN'}`,
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
  }, [source])

  const [serverStatus, setServerStatus] = useState('Checking server…')

  useEffect(() => {
    const controller = new AbortController()

    async function checkServer() {
      if (source === 'demo') {
        setServerStatus('Demo profile · sample data')
        return
      }
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
  }, [source])

  const [activeHunt, setActiveHunt] = useState<ActiveHunt | null>(() =>
    readActiveHunt(ACTIVE_HUNT_KEY, source),
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
      else localStorage.setItem(ACTIVE_HUNT_KEY, 'null')
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
  const previousPath = useRef(location.pathname)
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
    if (previousPath.current !== location.pathname) {
      document.getElementById('page-title')?.focus({ preventScroll: true })
      previousPath.current = location.pathname
    }
  }, [location.pathname, title])

  if (location.pathname === '/' && location.hash === '#library')
    return <Navigate to="/games" replace />

  return (
    <div
      className={`dashboard${location.pathname === '/' ? ' dashboard-home' : ''}`}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="PlatinumOS — Dashboard">
          <img
            className="brand-mark"
            src={`${import.meta.env.BASE_URL}platinumos-logo.png`}
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
          <h1 id="page-title" tabIndex={-1}>
            {title}
          </h1>
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
function App() {
  const allowPsn = ['localhost', '127.0.0.1', '[::1]'].includes(
    window.location.hostname,
  )
  const [source, setSource] = useState<DataSource>(() => {
    try {
      return allowPsn && localStorage.getItem('platinumos.source.v1') === 'psn'
        ? 'psn'
        : 'demo'
    } catch {
      return 'demo'
    }
  })
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const navigate = useNavigate()
  function changeSource(next: DataSource) {
    try {
      localStorage.setItem('platinumos.source.v1', next)
      setNotice('')
    } catch {
      setNotice(
        'Source changed for this session only. Browser storage is unavailable.',
      )
    }
    setConfirmReset(false)
    setSource(next)
    void navigate('/')
  }
  function resetDemo() {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith('platinumos.demo.'),
      )
      keys.forEach((key) => localStorage.removeItem(key))
      setRevision((value) => value + 1)
      setConfirmReset(false)
      setNotice('Demo reset to its starting profile.')
      void navigate('/')
    } catch {
      setNotice(
        'Could not reset demo storage. Try again when browser storage is available.',
      )
    }
  }
  return (
    <DataSourceContext.Provider value={source}>
      <section className="source-controls" aria-label="Profile controls">
        <div>
          <strong>
            {source === 'demo' ? 'Demo profile' : 'Local PSN profile'}
          </strong>
          <p>
            {source === 'demo'
              ? 'Fictional games and sample statistics. Your changes stay in this browser.'
              : 'Your configured local PSN connection. Plans are separate from demo.'}
          </p>
        </div>
        <div className="library-field">
          <label htmlFor="data-source">Data source</label>
          <select
            id="data-source"
            value={source}
            onChange={(event) =>
              changeSource(event.target.value === 'psn' ? 'psn' : 'demo')
            }
          >
            <option value="demo">Demo</option>
            {allowPsn && <option value="psn">Local PSN</option>}
          </select>
        </div>
        {source === 'demo' && (
          <button
            type="button"
            className="primary-button secondary-button"
            onClick={() => setConfirmReset(true)}
          >
            Reset demo
          </button>
        )}
        {confirmReset && (
          <div className="reset-confirm">
            <p>
              Reset demo plans, tips and active hunt? Your PSN plans will stay
              unchanged.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={resetDemo}
            >
              Confirm reset
            </button>
            <button
              type="button"
              className="primary-button secondary-button"
              onClick={() => setConfirmReset(false)}
            >
              Cancel reset
            </button>
          </div>
        )}
        <p role="status">{notice}</p>
      </section>
      <AppContent key={source + revision} />
    </DataSourceContext.Provider>
  )
}
export default App
