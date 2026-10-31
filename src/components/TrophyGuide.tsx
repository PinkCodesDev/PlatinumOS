import type { Game } from '../types'
import { getTrophyGuide } from '../data/trophyGuides'

export default function TrophyGuide({ game }: { game: Game }) {
  const guide = getTrophyGuide(game)
  const searchUrl =
    'https://www.google.com/search?q=' +
    encodeURIComponent(
      'site:psnprofiles.com/guide/ ' +
        game.title.replace(/[®™]/g, '').trim() +
        ' trophy guide ' +
        (game.platform ?? ''),
    )
  return (
    <section className="game-guide" aria-labelledby="guide-title">
      <h2 id="guide-title">Trophy guide · PSNProfiles</h2>
      {guide ? (
        <>
          <p>{guide.title}</p>
          <p className="details-note">By {guide.authors}</p>
          <a
            className="primary-button"
            href={guide.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open guide on PSNProfiles (new tab)
          </a>
        </>
      ) : (
        <>
          <p>
            No confirmed PSNProfiles guide link is available for this game yet.
          </p>
          <a
            className="primary-button"
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Search Google for a PSNProfiles guide (new tab)
          </a>
        </>
      )}
      {game.definedTrophies?.platinum === 0 && (
        <p className="details-note">
          This game has no platinum trophy. Aim for all trophies instead.
        </p>
      )}
      <p className="details-note">
        External community guide. Check the platform, updates and online trophy
        availability in the guide.
      </p>
    </section>
  )
}
