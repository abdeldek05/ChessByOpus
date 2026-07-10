// Nuages golden hour à l'horizon : quelques volumes de billboards drei <Cloud>,
// teintés chaud, placés haut et loin du pas de tir. Dérive très lente (quasi
// statiques) pour un coût GPU minimal — la profondeur du ciel sans sacrifier
// la fluidité.

export interface CloudSpec {
  position: [number, number, number]
  /** Étendue du volume (x, y, z). */
  bounds: [number, number, number]
  /** Densité de billboards dans le volume. */
  segments: number
  volume: number
  opacity: number
  seed: number
}

export const CLOUDS: CloudSpec[] = [
  { position: [-260, 150, -320], bounds: [90, 14, 40], segments: 14, volume: 34, opacity: 0.5, seed: 3 },
  { position: [300, 175, -180], bounds: [110, 16, 44], segments: 16, volume: 40, opacity: 0.42, seed: 11 },
  { position: [120, 195, 340], bounds: [80, 12, 36], segments: 12, volume: 30, opacity: 0.38, seed: 23 },
  { position: [-340, 165, 200], bounds: [95, 15, 40], segments: 13, volume: 36, opacity: 0.45, seed: 31 },
  { position: [40, 210, -420], bounds: [130, 18, 50], segments: 16, volume: 46, opacity: 0.36, seed: 47 },
]

/** Teinte chaude golden hour des nuages et dérive (très lente). */
export const CLOUD_COLOR = '#f4dcb8'
export const CLOUD_DRIFT_SPEED = 0.04
/** Plafond de billboards du groupe <Clouds> (garde-fou perf). */
export const CLOUDS_LIMIT = 220
