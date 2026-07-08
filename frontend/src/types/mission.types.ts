import type { RadarConfig } from '@/types/radar.types'

export type MesangeRole = 'KING' | 'QUEEN' | 'PAWN'

export interface RadarPosition {
  latitude: number
  longitude: number
}

export interface MesangeLaunchConfig {
  id: string
  /** KING = menace principale, QUEEN = leurre principal, PAWN = leurre de saturation. */
  role: MesangeRole
  /** Direction du tir, 0–360°. Fixée à la boussole sur la carte (pas de tir = site). */
  azimuthDeg: number
  /** Angle au lancement, 45–90° (90 = vertical). */
  inclinationDeg: number
  /** Délai de mise à feu en secondes par rapport à t=0 du scénario. */
  launchDelaySec: number
}

/** Un radar placé par l'utilisateur : sa config + sa position sur la carte (1-2 par scénario). */
export interface PlacedRadar {
  id: string
  config: RadarConfig
  position: RadarPosition | null
}
