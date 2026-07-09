// Débris de la Mesange à l'impact (placeholder visuel — pas de vraie physique).
// Quelques fragments partent du point de crash dans des directions aléatoires
// mais déterministes (seed fixe), retombent avec gravité et tournent.

export interface DebrisSpec {
  /** Direction initiale d'éjection (sera normalisée puis mise à l'échelle). */
  dir: [number, number, number]
  /** Vitesse d'éjection (unités/s). */
  speed: number
  /** Axe de rotation (tumbling). */
  spinAxis: [number, number, number]
  /** Taille du fragment (unités). */
  size: number
}

// Gravité appliquée aux fragments (unités/s²).
export const DEBRIS_GRAVITY = 55
// Rebond/amortissement au sol : les fragments s'immobilisent une fois posés.
export const DEBRIS_FLOOR_Y = 0.15

// Teintes des débris : corps clair et laiton de la Mesange (jamais de rouge).
export const DEBRIS_COLORS = ['#c9cbc8', '#cdbb98', '#94866e'] as const

// Éclats fixes (seed déterministe) : directions réparties, tailles variées.
export const DEBRIS_PIECES: DebrisSpec[] = [
  { dir: [0.6, 1.0, 0.2], speed: 14, spinAxis: [1, 0.4, 0.2], size: 0.5 },
  { dir: [-0.7, 0.8, 0.3], speed: 12, spinAxis: [0.2, 1, 0.3], size: 0.42 },
  { dir: [0.2, 1.1, -0.7], speed: 16, spinAxis: [0.5, 0.2, 1], size: 0.6 },
  { dir: [-0.4, 0.9, -0.5], speed: 11, spinAxis: [1, 0.6, 0], size: 0.36 },
  { dir: [0.9, 0.7, 0.1], speed: 15, spinAxis: [0.3, 1, 0.5], size: 0.48 },
  { dir: [-0.2, 1.2, 0.6], speed: 13, spinAxis: [0.7, 0.3, 1], size: 0.4 },
]
