import type { Game } from '../types'

// Guide IDs and metadata: https://github.com/langdonx/trophy-guide-list-json
// Matched to this library by title and platform, 2026-11-01.
// PSNProfiles blocks automated page checks; links are catalog-sourced.
type TrophyGuide = { url: string; title: string; authors: string }
const guides: Record<string, TrophyGuide> = {
  'trophy:NPWR11424_00': {
    url: 'https://psnprofiles.com/guide/6626-assassins-creed-origins-trophy-guide',
    title: "Assassin's Creed Origins Trophy Guide",
    authors: 'ThaKingTropy',
  },
  'trophy:NPWR06600_00': {
    url: 'https://psnprofiles.com/guide/3324-assassins-creed-unity-trophy-guide',
    title: "Assassin's Creed Unity Trophy Guide",
    authors: 'pese-97, madbuk, Pesentii',
  },
  'trophy2:NPWR41753_00': {
    url: 'https://psnprofiles.com/guide/21909-assassins-creed-shadows-trophy-guide',
    title: "Assassin's Creed Shadows Trophy Guide",
    authors: 'Argandalf_01, MohandGamer7, pjcooper2012',
  },
  'trophy:NPWR13822_00': {
    url: 'https://psnprofiles.com/guide/8002-assassins-creed-odyssey-trophy-guide',
    title: "Assassin's Creed Odyssey Trophy Guide",
    authors: 'ARB1992',
  },
  'trophy:NPWR17986_00': {
    url: 'https://psnprofiles.com/guide/14339-sid-meiers-civilization-vi-trophy-guide',
    title: "Sid Meier's Civilization VI Trophy Guide",
    authors: 'joaomsousa',
  },
  'trophy2:NPWR35517_00': {
    url: 'https://psnprofiles.com/guide/17925-ea-sports-fc-24-trophy-guide',
    title: 'EA Sports FC 24 Trophy Guide',
    authors: 'masteroxx',
  },
  'trophy2:NPWR29960_00': {
    url: 'https://psnprofiles.com/guide/16087-dead-space-trophy-guide',
    title: 'Dead Space Trophy Guide',
    authors: 'luiz_felipe64',
  },
  'trophy:NPWR08538_00': {
    url: 'https://psnprofiles.com/guide/3565-need-for-speed-trophy-guide',
    title: 'Need for Speed Trophy Guide',
    authors: 'mokrinsky',
  },
  'trophy2:NPWR29894_00': {
    url: 'https://psnprofiles.com/guide/17777-assassins-creed-mirage-trophy-guide',
    title: "Assassin's Creed Mirage Trophy Guide",
    authors: 'Argandalf_01',
  },
  'trophy:NPWR13348_00': {
    url: 'https://psnprofiles.com/guide/10411-the-last-of-us-part-ii-trophy-guide',
    title: 'The Last of Us Part II Trophy Guide',
    authors: 'BlackTorito',
  },
  'trophy2:NPWR20954_00': {
    url: 'https://psnprofiles.com/guide/11538-assassins-creed-valhalla-trophy-guide',
    title: "Assassin's Creed Valhalla Trophy Guide",
    authors: 'Argandalf_01',
  },
  'trophy:NPWR11263_00': {
    url: 'https://psnprofiles.com/guide/10700-overcooked-trophy-guide',
    title: 'Overcooked Trophy Guide',
    authors: 'NCSFan001',
  },
  'trophy2:NPWR24695_00': {
    url: 'https://psnprofiles.com/guide/11418-cyberpunk-2077-trophy-guide',
    title: 'Cyberpunk 2077 Trophy Guide',
    authors: 'MohandGamer7',
  },
  'trophy:NPWR10569_00': {
    url: 'https://psnprofiles.com/guide/6615-middle-earth-shadow-of-war-trophy-guide',
    title: 'Middle-earth: Shadow of War Trophy Guide',
    authors: 'Dessane',
  },
  'trophy:NPWR07466_00': {
    url: 'https://psnprofiles.com/guide/3048-rocket-league-trophy-guide',
    title: 'Rocket League Trophy Guide',
    authors: 'Battlebared, ackendo_',
  },
  'trophy2:NPWR22022_00': {
    url: 'https://psnprofiles.com/guide/7964-fortnite-trophy-guide',
    title: 'Fortnite Trophy Guide',
    authors: 'phoenixgaming240, OverlordOfRacing, Phoenixgaming1',
  },
  'trophy2:NPWR21175_00': {
    url: 'https://psnprofiles.com/guide/16103-hogwarts-legacy-trophy-guide',
    title: 'Hogwarts Legacy Trophy Guide',
    authors: 'Argandalf_01, Charizarzar, Dsr8002, MohandGamer7',
  },
  'trophy:NPWR09687_00': {
    url: 'https://psnprofiles.com/guide/4003-far-cry-primal-trophy-guide',
    title: 'Far Cry Primal Trophy Guide',
    authors: 'SuperSmexy500',
  },
  'trophy2:NPWR22392_00': {
    url: 'https://psnprofiles.com/guide/15509-god-of-war-ragnarok-trophy-guide',
    title: 'God of War Ragnarök Trophy Guide',
    authors: 'MohandGamer7, Charizarzar',
  },
  'trophy:NPWR13087_00': {
    url: 'https://psnprofiles.com/guide/7228-a-way-out-trophy-guide',
    title: 'A Way Out Trophy Guide',
    authors: 'ddracarys, SnuggleButt_',
  },
  'trophy:NPWR19785_00': {
    url: 'https://psnprofiles.com/guide/11418-cyberpunk-2077-trophy-guide',
    title: 'Cyberpunk 2077 Trophy Guide',
    authors: 'MohandGamer7',
  },
  'trophy:NPWR18041_00': {
    url: 'https://psnprofiles.com/guide/10277-need-for-speed-heat-trophy-guide',
    title: 'Need for Speed Heat Trophy Guide',
    authors: 'pilotpsk',
  },
  'trophy:NPWR21460_00': {
    url: 'https://psnprofiles.com/guide/11143-need-for-speed-hot-pursuit-remastered-trophy-guide',
    title: 'Need for Speed Hot Pursuit Remastered Trophy Guide',
    authors: 'OverlordOfRacing',
  },
}

export function getTrophyGuide(
  game: Pick<Game, 'id' | 'serviceName'>,
): TrophyGuide | undefined {
  return guides[`${game.serviceName}:${game.id}`]
}
