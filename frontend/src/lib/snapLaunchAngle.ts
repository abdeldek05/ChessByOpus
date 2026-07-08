// Angles de rampe « connus » (degrés d'inclinaison, 90 = vertical). La géométrie
// de la rampe se cale sur l'un d'eux ; le TIR, lui, utilise l'angle exact de
// l'utilisateur (voir modèle balistique / back). On ne modélise donc pas une
// rampe par angle précis, juste ces positions discrètes.
export const RAIL_SNAP_ANGLES = [45, 70, 90] as const

/**
 * Ramène une inclinaison quelconque (deg) à l'angle de rampe connu le plus
 * proche parmi RAIL_SNAP_ANGLES. Pur.
 */
export function snapLaunchAngle(inclinationDeg: number): number {
  return RAIL_SNAP_ANGLES.reduce((best, angle) =>
    Math.abs(angle - inclinationDeg) < Math.abs(best - inclinationDeg) ? angle : best,
  )
}
