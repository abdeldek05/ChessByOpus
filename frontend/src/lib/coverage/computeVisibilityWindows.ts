import type { TrajectoryPoint } from '@/lib/api'
import type { RadarConfig } from '@/types/radar.types'
import {
  COVERAGE_ELEVATION_MIN_DEG,
  COVERAGE_ELEVATION_MAX_DEG,
} from '@/constants/coverage'

/** Fenêtre continue de visibilité de la fusée par un radar. */
export interface VisibilityWindow {
  /** Temps de vol (s) d'entrée/sortie de couverture. */
  tIn: number
  tOut: number
  /** Indices des échantillons de trajectoire bornant la fenêtre. */
  iIn: number
  iOut: number
  durationSec: number
}

/** Raison exacte pour laquelle un point de trajectoire est vu/masqué par un
 *  radar — chacune correspond à UNE des 4 conditions testées par
 *  `classifyCoverage`, dans l'ordre où elles sont vérifiées (la première qui
 *  échoue devient la cause : un point peut être à la fois hors-portée ET
 *  au-dessus du plafond, seule la première rencontrée est rapportée, comme
 *  un radariste lirait la limite la plus proche). */
export type CoverageReason = 'visible' | 'out-of-range' | 'above-ceiling' | 'cone-of-silence' | 'below-horizon-mask'

/**
 * Classifie POURQUOI un point de trajectoire est vu ou masqué par un radar —
 * même géométrie que l'ancien `isInCoverage` (portée, plafond, élévation
 * min/max), mais retourne la cause au lieu d'un simple booléen : c'est cette
 * cause qui alimente le bandeau HUD live (« perdu — cône de silence ») et,
 * plus tard, la coupe verticale. Pure géométrie (suggestion Thales) — ne
 * préjuge pas de la détection réelle (RCS, balayage d'antenne), rôle du
 * moteur backend.
 *
 * N'a besoin QUE des coordonnées ENU (x, y, z) — type élargi (au lieu du
 * TrajectoryPoint complet) pour accepter aussi une position LIVE reconstituée
 * frame par frame (voir useVisibilityCorridorTrail), pas seulement un point
 * d'échantillon de la trajectoire brute.
 */
export function classifyCoverage(
  point: Pick<TrajectoryPoint, 'x' | 'y' | 'z'>,
  radarEastM: number,
  radarNorthM: number,
  config: RadarConfig,
): CoverageReason {
  const elevMaxDeg = config.elevationMaxDeg ?? COVERAGE_ELEVATION_MAX_DEG
  const dE = point.x - radarEastM
  const dN = point.y - radarNorthM
  const dAlt = point.z - config.antennaHeightM
  const dGround = Math.hypot(dE, dN)
  const d3 = Math.hypot(dGround, dAlt)
  if (d3 > config.rangeKm * 1000) return 'out-of-range'
  if (point.z > config.ceilingM) return 'above-ceiling'
  const elevDeg = (Math.atan2(dAlt, dGround) * 180) / Math.PI
  if (elevDeg > elevMaxDeg) return 'cone-of-silence'
  if (elevDeg < COVERAGE_ELEVATION_MIN_DEG) return 'below-horizon-mask'
  return 'visible'
}

/**
 * Le point de trajectoire est-il dans l'enveloppe INSTRUMENTÉE du radar ?
 * Wrapper booléen de `classifyCoverage`, pour les appelants qui n'ont besoin
 * que du vu/pas-vu (fenêtres de visibilité, corridor 3D) sans la cause.
 */
export function isInCoverage(
  point: Pick<TrajectoryPoint, 'x' | 'y' | 'z'>,
  radarEastM: number,
  radarNorthM: number,
  config: RadarConfig,
): boolean {
  return classifyCoverage(point, radarEastM, radarNorthM, config) === 'visible'
}

/**
 * Fenêtres de visibilité [tIn, tOut] de la trajectoire pour UN radar :
 * balayage des échantillons (0.2 s réels — précision largement suffisante
 * pour l'affichage), regroupés en plages continues. Fonction pure — partagée
 * par la coupe Thales, le HUD live et le replay 3D (une seule source).
 */
export function computeVisibilityWindows(
  trajectory: TrajectoryPoint[],
  radarEastM: number,
  radarNorthM: number,
  config: RadarConfig,
): VisibilityWindow[] {
  const windows: VisibilityWindow[] = []
  let startIndex = -1

  const push = (iIn: number, iOut: number) => {
    const tIn = trajectory[iIn].t
    const tOut = trajectory[iOut].t
    windows.push({ tIn, tOut, iIn, iOut, durationSec: tOut - tIn })
  }

  trajectory.forEach((point, i) => {
    const visible = isInCoverage(point, radarEastM, radarNorthM, config)
    if (visible && startIndex < 0) startIndex = i
    if (!visible && startIndex >= 0) {
      push(startIndex, i - 1)
      startIndex = -1
    }
  })
  if (startIndex >= 0) push(startIndex, trajectory.length - 1)

  return windows
}
