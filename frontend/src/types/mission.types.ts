export type MesangeRole = 'KING' | 'QUEEN' | 'PAWN'

export interface MesangeLaunchConfig {
  id: string
  /** KING = menace principale, QUEEN = leurre principal, PAWN = leurre de saturation. */
  role: MesangeRole
  /** Direction du tir, 0–360°. */
  azimuthDeg: number
  /** Angle au lancement, 45–90° (90 = vertical). */
  inclinationDeg: number
  /** Délai de mise à feu en secondes par rapport à t=0 du scénario. */
  launchDelaySec: number
}

export interface RadarPosition {
  latitude: number
  longitude: number
}
