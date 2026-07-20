import { COVERAGE_LOBE_ARC_STEP_DEG } from '@/constants/coverage'

export interface LobeHalfInput {
  /** Portée instrumentée (m). */
  rangeM: number
  /** Écart latéral du radar au plan de coupe (m) — réduit le rayon effectif. */
  offAxisM: number
  /** Hauteur d'antenne (m). */
  antennaHeightM: number
  /** Plafond instrumenté (m). */
  ceilingM: number
  /** Élévations min/max du faisceau (deg). */
  elevMinDeg: number
  elevMaxDeg: number
}

/**
 * DEMI-lobe de couverture du radar dans le plan de coupe, en coordonnées
 * locales (u = distance horizontale au radar le long de l'axe ≥ 0,
 * alt = altitude absolue m). Le lobe complet est symétrique : le rendu place
 * les points en sRadar ± u. Bordé par : rayon d'élévation min (masque
 * d'horizon), arc de portée effective (√(R² − écart latéral²)), plafond
 * instrumenté, rayon d'élévation max (cône de silence) — exactement les
 * caractéristiques demandées par Thales. Retourne null si le plan de coupe
 * est hors de portée du radar. Fonction pure.
 */
export function computeCoverageLobeHalf(input: LobeHalfInput): Array<[number, number]> | null {
  const { rangeM, offAxisM, antennaHeightM, ceilingM, elevMinDeg, elevMaxDeg } = input
  const rEffSq = rangeM * rangeM - offAxisM * offAxisM
  if (rEffSq <= 0) return null
  const rEff = Math.sqrt(rEffSq)

  // Hauteur de plafond au-dessus de l'antenne : en dessous, pas de volume.
  const zc = ceilingM - antennaHeightM
  if (zc <= 0) return null

  const toRad = Math.PI / 180
  const thetaMin = elevMinDeg * toRad
  const thetaMax = elevMaxDeg * toRad
  // Angle au-delà duquel l'arc de portée dépasse le plafond.
  const thetaCeil = zc >= rEff ? Math.PI / 2 : Math.asin(zc / rEff)

  const points: Array<[number, number]> = [[0, antennaHeightM]]

  if (thetaCeil <= thetaMin) {
    // Plafond si bas que même le rayon d'élévation min le crève avant l'arc :
    // le lobe est le quadrilatère pincé entre les deux rayons et le plafond.
    points.push([zc / Math.tan(thetaMin), ceilingM])
    points.push([zc / Math.tan(thetaMax), ceilingM])
    return points
  }

  // Arc de portée effective, de l'élévation min jusqu'au plafond ou à
  // l'élévation max (le premier atteint).
  const thetaTop = Math.min(thetaMax, thetaCeil)
  const step = COVERAGE_LOBE_ARC_STEP_DEG * toRad
  for (let theta = thetaMin; theta < thetaTop; theta += step) {
    points.push([rEff * Math.cos(theta), antennaHeightM + rEff * Math.sin(theta)])
  }
  points.push([rEff * Math.cos(thetaTop), antennaHeightM + rEff * Math.sin(thetaTop)])

  // Si le plafond coupe avant l'élévation max : segment de plafond vers
  // l'intérieur jusqu'au rayon d'élévation max.
  if (thetaTop < thetaMax) {
    points.push([zc / Math.tan(thetaMax), ceilingM])
  }

  // Le rendu ferme le polygone vers le point de pincement (0, antennaHeightM).
  return points
}
