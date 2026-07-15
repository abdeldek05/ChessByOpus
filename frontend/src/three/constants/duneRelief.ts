// Relief de DUNES du biome désert : champs de dunes directionnels (crêtes
// allongées perpendiculaires au vent dominant, profil pincé au sommet), houle
// de fond, et MÉGA-DUNES au nord (pendant désertique des collines de prairie).
// La zone du pas de tir reste plate (mêmes rayons que la prairie).

export interface DuneSystem {
  /** Amplitude de la crête (unités scène). */
  amplitude: number
  /** Fréquence spatiale le long du vent (1/unités). */
  freq: number
  /** Direction du vent (rad) — les crêtes lui sont perpendiculaires. */
  dirRad: number
  /** Serpentement des crêtes : fréquence et amplitude de la dérive latérale. */
  wanderFreq: number
  wanderAmp: number
  phase: number
}

// Deux systèmes superposés : grandes dunes lentes + dunes secondaires croisées.
export const DUNE_SYSTEMS: DuneSystem[] = [
  { amplitude: 4.6, freq: 0.016, dirRad: 0.28, wanderFreq: 0.008, wanderAmp: 22, phase: 0.4 },
  { amplitude: 2.0, freq: 0.038, dirRad: 0.85, wanderFreq: 0.013, wanderAmp: 10, phase: 2.6 },
]

// Pincement des crêtes : exposant du profil (1 = sinus doux, 2+ = crête vive).
export const CREST_SHARPNESS = 1.7

// ESPLANADE du complexe : en désert, la zone nivelée est LARGE (comme une vraie
// base graded dans le sable) — routes, bâtiments et mâts reposent dessus, les
// dunes ne commencent qu'au-delà.
export const DESERT_FLAT_RADIUS = 85
export const DESERT_FLAT_FALLOFF = 70

// Houle de fond très large (ondulation générale du champ de dunes).
export const SWELL = { amplitude: 1.6, freqX: 0.006, freqZ: 0.005, phase: 1.9 } as const

// MÉGA-DUNES au nord (-Z) : montée progressive vers un horizon de hautes crêtes.
export const MEGA_DUNES = {
  amplitude: 38,
  startZ: 130,
  fullZ: 310,
  ridgeFreqX: 0.006,
  ridgeFreqZ: 0.004,
  ridgePhase: 0.9,
  crestSharpness: 1.6,
} as const

// Ombrage du sable par SOMMET de maillage (vertex colors) : les pentes raides
// (faces d'avalanche) foncent et se saturent, les replats/crêtes s'éclairent.
export const SAND_SHADE = {
  light: '#dcc493',
  dark: '#9d7f56',
} as const
