// Scène du réglage d'élévation (panneau Menaces) : fusée-sonde simplifiée
// (primitives lisses, pas de GLB) pivotant autour de sa base + arc gradué
// 70–90°. Unités scène, cohérentes avec la caméra de InclinationCanvas.

// Bornes uniques du scénario (miroir de la validation) — pas de double vérité.
export {
  INCLINATION_MIN as INCLINATION_MIN_DEG,
  INCLINATION_MAX as INCLINATION_MAX_DEG,
} from '@/lib/validateScenario'

// Accent HUD (arc, ticks, marqueur) : laiton clair du thème.
export const ARC_COLOR = '#cdbb98'

/** Fusée-sonde : corps très élancé, ogive effilée, petits ailerons. */
export const ROCKET = {
  bodyRadius: 0.14,
  bodyHeight: 3.1,
  noseHeight: 1.1,
  finWidth: 0.24,
  finHeight: 0.45,
  finThickness: 0.02,
  /** Liseré laiton entre corps et ogive. */
  collarHeight: 0.08,
  /** Tuyère (cône tronqué sombre) sous le corps. */
  nozzleHeight: 0.12,
  /** Dégagement entre le pivot (base) et le bas de la tuyère. */
  liftOff: 0.05,
} as const

// Matières calées sur la vraie Mesange (corps clair, ogive laiton).
export const ROCKET_COLORS = {
  body: '#c9cbc8',
  nose: '#cdbb98',
  collar: '#94866e',
  fin: '#94866e',
  nozzle: '#3a3d38',
} as const

/** Arc gradué autour du pivot. */
export const ARC = {
  radius: 4.5,
  tickLength: 0.18,
} as const
