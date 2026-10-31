import type { Dispatch, SetStateAction } from 'react'
import type { Game, GamesLoadState, SortOrder, ProgressFilter } from '../types'
import GameCard from '../components/GameCard'
type Props = {
  games: Game[]
  gamesLoadState: GamesLoadState
  gamesStatus: string
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  sortOrder: SortOrder
  setSortOrder: Dispatch<SetStateAction<SortOrder>>
  progressFilter: ProgressFilter
  setProgressFilter: Dispatch<SetStateAction<ProgressFilter>>
}
export default function LibraryPage({
  games,
  gamesLoadState,
  gamesStatus,
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  progressFilter,
  setProgressFilter,
}: Props) {
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

      <div className="library-grid">
        {sortedGames.map((game) => (
          <GameCard key={`${game.serviceName}:${game.id}`} game={game} />
        ))}
      </div>
    </section>
  )
}
