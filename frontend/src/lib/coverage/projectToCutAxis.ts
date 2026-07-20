import type { TrajectoryPoint } from '@/lib/api'

/** Un point de trajectoire projeté dans le plan vertical de l'axe de tir. */
export interface CutPoint {
  t: number
  /** Distance au sol LE LONG de l'axe de tir (m, signée — négatif = derrière le pad). */
  sM: number
  /** Altitude au-dessus du sol du site (m). */
  altM: number
  /** Vitesse réelle (m/s) au point. */
  v: number
}

/** Direction unitaire de l'axe de tir en ENU : azimut aéro (0=Nord, horaire). */
function axisDirection(azimuthDeg: number): { alongE: number; alongN: number } {
  const az = (azimuthDeg * Math.PI) / 180
  return { alongE: Math.sin(az), alongN: Math.cos(az) }
}

/**
 * Projette la trajectoire (ENU mètres, x=est/y=nord/z=altitude) dans le plan
 * vertical passant par le pas de tir et orienté selon l'azimut de tir — la
 * « coupe distance au sol × altitude dans l'axe de la trajectoire » demandée
 * par Thales. La dérive latérale (vent) est écrasée sur le plan : c'est une
 * projection, pas une abscisse curviligne.
 */
export function projectTrajectoryToCutAxis(trajectory: TrajectoryPoint[], azimuthDeg: number): CutPoint[] {
  const { alongE, alongN } = axisDirection(azimuthDeg)
  return trajectory.map((p) => ({
    t: p.t,
    sM: p.x * alongE + p.y * alongN,
    altM: p.z,
    v: p.v,
  }))
}

export interface AxisProjection {
  /** Position le long de l'axe (m, signée). */
  sM: number
  /** Écart latéral au plan de coupe (m, toujours ≥ 0). */
  offAxisM: number
}

/**
 * Projette un point ENU quelconque (ex. le radar) sur l'axe de tir : position
 * le long de l'axe + écart latéral au plan (sert à réduire le rayon effectif
 * du lobe de couverture dans la coupe).
 */
export function projectPointToCutAxis(eastM: number, northM: number, azimuthDeg: number): AxisProjection {
  const { alongE, alongN } = axisDirection(azimuthDeg)
  return {
    sM: eastM * alongE + northM * alongN,
    offAxisM: Math.abs(eastM * alongN - northM * alongE),
  }
}
