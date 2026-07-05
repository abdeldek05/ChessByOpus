// Géométrie du banc de tir, inspirée du pas de tir réel Opus Aerospace :
// deux piliers de gros blocs béton formant un portail, dalle au sol, plateau
// acier avec garde-corps, mât-rail vertical, échelle d'accès et drapeau vert.
// Unités de scène : la Mesange fait ~5.62 unités de haut.

// Blocs béton empilés des deux piliers porteurs.
export const BLOCK = { width: 1.35, height: 1.02, depth: 1.28 }
export const PIER_ROWS = 3
export const PIER_BLOCKS_PER_ROW = 2
// Écart intérieur entre piliers (le « portail » sous le plateau).
export const PIER_GAP = 1.7
export const PIER_CENTER_X = PIER_GAP / 2 + BLOCK.width / 2

// Dalle béton au sol autour du banc.
export const SLAB = { width: 13, depth: 10, height: 0.14 }

// Plateau acier posé sur les piliers.
export const DECK = { width: 5.4, depth: 3.3, height: 0.2 }
export const DECK_BASE_Y = SLAB.height + PIER_ROWS * BLOCK.height
export const DECK_TOP_Y = DECK_BASE_Y + DECK.height

// Mât-rail vertical qui guide la fusée au décollage : dépasse sa coiffe.
export const MAST = { height: 6.3, beam: 0.13, spacing: 0.52, z: -0.62, rungEvery: 0.72 }

// La fusée se dresse juste devant le mât, centrée sur le plateau.
export const ROCKET_POSITION = { x: 0, z: -0.18 }
// Hauteur de repli en attendant la mesure précise de la bounding box.
export const ROCKET_FALLBACK_HALF_HEIGHT = 2.81

// Garde-corps du plateau (ouverture côté échelle, en façade droite).
export const RAILING = {
  height: 1.08,
  midHeight: 0.6,
  postRadius: 0.038,
  railRadius: 0.028,
  inset: 0.14,
  openingWidth: 0.7,
}

// Échelle d'accès inclinée, adossée à la façade du plateau.
export const LADDER = {
  width: 0.52,
  railRadius: 0.045,
  rungRadius: 0.024,
  rungEvery: 0.34,
  tiltRad: 0.22,
}

// Drapeau vert « zone dégagée » sur le coin arrière droit.
export const FLAG = { poleHeight: 1.6, poleRadius: 0.03, width: 0.92, height: 0.55, waveDepth: 0.09 }

export const RIG_COLORS = {
  slab: '#9b9d99',
  steelDeck: '#575f68',
  beam: '#8b939b',
  galva: '#c6ccd2',
  mast: '#e2e5e8',
  ladder: '#cfd4d9',
  flag: '#22a24b',
  pole: '#d8dcdf',
}
