import ProTips from '../components/ProTips'
import TrophyGuide from '../components/TrophyGuide'
import { usePlatinumPlan } from '../hooks/usePlatinumPlan'
import PlatinumPlanner from '../components/PlatinumPlanner'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
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
  const { hash } = useLocation()
  const navigate = useNavigate()
  const tabs = [
    { id: 'tracker', label: 'Trophies' },
    { id: 'planner', label: 'Planner' },
    { id: 'guide', label: 'Guide' },
  ] as const
  const activeTab = tabs.find((tab) => '#' + tab.id === hash)?.id ?? 'tracker'
  const isActiveHunt =
    activeHunt?.id === game.id && activeHunt.serviceName === game.serviceName
  function selectTab(id: string) {
    void navigate({ hash: '#' + id }, { replace: false })
  }
  return (
    <>
      <section className="game-summary" aria-labelledby="game-details-title">
        <div className="game-details-header">
          <div>
            <p className="eyebrow">GAME DETAILS</p>
            <h2 id="game-details-title" tabIndex={-1}>
              {game.title}
            </h2>
            <p>
              {game.platform ?? 'Unknown platform'} ·{' '}
              {game.progress === null
                ? 'Progress unavailable'
                : `${game.progress}% complete`}
            </p>
          </div>
          <Link className="primary-button" to="/games">
            Back to library
          </Link>
        </div>
        {game.progress !== null && (
          <progress
            className="trophy-progress"
            value={game.progress}
            max={100}
            aria-label={`Trophy progress for ${game.title}`}
          />
        )}
        <button
          className="primary-button"
          type="button"
          disabled={isActiveHunt}
          onClick={() => onSetActiveHunt(game)}
        >
          {isActiveHunt ? 'Current active hunt' : 'Set as active hunt'}
        </button>

        <p role="status">{huntMessage}</p>
      </section>
      <div className="game-tabs" role="tablist" aria-label="Game sections">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={'tab-' + tab.id}
            aria-controls={'panel-' + tab.id}
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => selectTab(tab.id)}
            onKeyDown={(event) => {
              let next: number
              if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
              else if (event.key === 'ArrowLeft')
                next = (index + tabs.length - 1) % tabs.length
              else if (event.key === 'Home') next = 0
              else if (event.key === 'End') next = tabs.length - 1
              else return
              event.preventDefault()
              selectTab(tabs[next].id)
              document.getElementById('tab-' + tabs[next].id)?.focus()
            }}
          >
            {tab.label}
            {tab.id === 'planner' && (
              <span className="tab-count">{plan.steps.length}</span>
            )}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="panel-tracker"
        aria-labelledby="tab-tracker"
        tabIndex={0}
        hidden={activeTab !== 'tracker'}
      >
        <GameDetails
          game={game}
          onAddToPlan={plan.addTrophy}
          plannedTrophyIds={plan.steps.flatMap((step) =>
            step.trophyId === undefined ? [] : [step.trophyId],
          )}
        />
      </div>
      <div
        role="tabpanel"
        id="panel-planner"
        aria-labelledby="tab-planner"
        tabIndex={0}
        hidden={activeTab !== 'planner'}
      >
        <PlatinumPlanner game={game} plan={plan} />
      </div>
      <div
        role="tabpanel"
        id="panel-guide"
        aria-labelledby="tab-guide"
        tabIndex={0}
        hidden={activeTab !== 'guide'}
      >
        <TrophyGuide game={game} />
        <ProTips game={game} plan={plan} />
      </div>
    </>
  )
}
