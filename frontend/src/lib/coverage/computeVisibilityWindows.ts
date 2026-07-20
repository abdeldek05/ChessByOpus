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

/**
 * Le point de trajectoire est-il dans l'enveloppe INSTRUMENTÉE du radar ?
 * Pure géométrie (suggestion Thales) : distance 3D ≤ portée, altitude ≤
 * plafond, élévation dans [min, max]. Ne préjuge PAS de la détection réelle
 * (RCS, balayage d'antenne) — c'est le rôle du moteur backend.
 *
 * N'a besoin QUE des coordonnées ENU (x, y, z) — type élargi (au lieu du
 * TrajectoryPoint complet) pour accepter aussi une position LIVE reconstituée
 * frame par frame (voir useVisibilityCorridorTrail), pas seulement un point
 * d'échantillon de la trajectoire brute.
 */
export function isInCoverage(
  point: Pick<TrajectoryPoint, 'x' | 'y' | 'z'>,
  radarEastM: number,
  radarNorthM: number,
  config: RadarConfig,
): boolean {
  const elevMaxDeg = config.elevationMaxDeg ?? COVERAGE_ELEVATION_MAX_DEG
  const dE = point.x - radarEastM
  const dN = point.y - radarNorthM
  const dAlt = point.z - config.antennaHeightM
  const dGround = Math.hypot(dE, dN)
  const d3 = Math.hypot(dGround, dAlt)
  if (d3 > config.rangeKm * 1000) return false
  if (point.z > config.ceilingM) return false
  const elevDeg = (Math.atan2(dAlt, dGround) * 180) / Math.PI
  return elevDeg >= COVERAGE_ELEVATION_MIN_DEG && elevDeg <= elevMaxDeg
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
