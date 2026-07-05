import { DECK, RAILING } from './launcherRig'

// Disposition du garde-corps : poteaux (coins + milieux) et lisses sur les
// quatre côtés du plateau, avec une ouverture en façade droite pour l'échelle.
// Tout est dérivé des dimensions du plateau — données statiques précalculées.

const HALF_W = DECK.width / 2 - RAILING.inset
const HALF_D = DECK.depth / 2 - RAILING.inset

export type RailingPost = [number, number]

export const RAILING_POSTS: RailingPost[] = [
  [-HALF_W, -HALF_D],
  [HALF_W, -HALF_D],
  [-HALF_W, HALF_D],
  [HALF_W, HALF_D],
  [0, -HALF_D],
  [0, HALF_D],
  [-HALF_W, 0],
  [HALF_W, 0],
]

export interface RailSegment {
  center: [number, number]
  height: number
  length: number
  alongX: boolean
}

const FRONT_LENGTH = 2 * HALF_W - RAILING.openingWidth
const FRONT_CENTER_X = -HALF_W + FRONT_LENGTH / 2

function buildRailSegments(): RailSegment[] {
  const segments: RailSegment[] = []
  for (const height of [RAILING.height, RAILING.midHeight]) {
    segments.push(
      { center: [0, -HALF_D], height, length: 2 * HALF_W, alongX: true },
      { center: [FRONT_CENTER_X, HALF_D], height, length: FRONT_LENGTH, alongX: true },
      { center: [-HALF_W, 0], height, length: 2 * HALF_D, alongX: false },
      { center: [HALF_W, 0], height, length: 2 * HALF_D, alongX: false },
    )
  }
  return segments
}

export const RAIL_SEGMENTS: RailSegment[] = buildRailSegments()

// L'échelle descend depuis l'ouverture de la façade.
export const LADDER_TOP_X = HALF_W - RAILING.openingWidth / 2
