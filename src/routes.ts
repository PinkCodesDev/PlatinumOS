import type { Game } from './types'

export function gamePath(game: Pick<Game, 'id' | 'serviceName'>) {
  return `/games/${game.serviceName}/${encodeURIComponent(game.id)}`
}
