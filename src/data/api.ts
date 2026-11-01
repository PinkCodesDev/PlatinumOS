import { demoGames, demoTrophies } from './demo'
import type { DataSource } from './source'
export async function requestData<T>(
  source: DataSource,
  path: string,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  if (source === 'demo') {
    const url = new URL(path, 'https://demo.invalid')
    let data: unknown
    if (url.pathname === '/api/psn/games')
      data = {
        source: 'DEMO',
        fetchedAt: '2026-10-30T12:00:00Z',
        games: demoGames,
      }
    else if (url.pathname === '/api/health') data = { status: 'ok' }
    else if (url.pathname === '/api/psn/recent')
      data = {
        games: demoGames
          .slice(0, 3)
          .map((game) => ({ ...game, lastPlayedAt: game.lastUpdatedAt })),
      }
    else if (url.pathname === '/api/psn/trophies') {
      const gameId = url.searchParams.get('gameId') ?? ''
      if (
        !demoTrophies[gameId] ||
        url.searchParams.get('serviceName') !== 'trophy'
      )
        throw new Error('Unknown demo game')
      data = {
        source: 'DEMO',
        gameId,
        serviceName: 'trophy',
        fetchedAt: '2026-10-30T12:00:00Z',
        trophies: demoTrophies[gameId],
      }
    } else throw new Error('Unknown demo endpoint')
    return structuredClone(data) as T
  }
  const response = await fetch(path, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json() as Promise<T>
}
