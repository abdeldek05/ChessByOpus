import type { RadarConfig } from '@/types/radar.types'
import type { RadarPosition, MesangeLaunchConfig } from '@/types/mission.types'
import type { LaunchSite } from '@/types/simulation.types'
import type { MissionResult, MissionVerdict } from '@/types/missionResult.types'
import type { FlightData } from '@/lib/api'

// Modèle de détection basé sur la VRAIE trajectoire RocketPy (points x/y/z en
// mètres ENU depuis le pas de tir). Pour chaque radar : la Mesange est accrochée
// au premier instant où elle est DANS la portée (distance 2D radar→fusée) ET
// sous le plafond. Verdict selon le préavis (accroche → impact) vs le seuil :
//   detected = préavis ≥ seuil · late = accrochée mais < seuil · missed = jamais.

const EARTH_R = 6371000 // m

/** Offset ENU (est, nord) en mètres d'un point lat/lng depuis le site. */
function enuOffset(site: LaunchSite, pos: RadarPosition): { east: number; north: number } {
  const latRad = (site.latitude * Math.PI) / 180
  const dLat = ((pos.latitude - site.latitude) * Math.PI) / 180
  const dLng = ((pos.longitude - site.longitude) * Math.PI) / 180
  return { east: dLng * Math.cos(latRad) * EARTH_R, north: dLat * EARTH_R }
}

/**
 * Bilan de détection à partir de la trajectoire réelle et des radars posés. Le
 * meilleur radar (plus grand préavis) donne le verdict. Fonction pure.
 */
export function computeDetection(
  site: LaunchSite,
  radars: { config: RadarConfig; position: RadarPosition | null }[],
  mesangeConfigs: MesangeLaunchConfig[],
  flight: FlightData,
): MissionResult {
  const placed = radars.filter((r) => r.position !== null)
  const totalThreats = mesangeConfigs.length
  const impactTime = flight.flightTimeSec

  if (placed.length === 0) {
    return emptyResult(totalThreats, 'No radar placed.')
  }

  let best: { leadSec: number; acqKm: number; acqTime: number } | null = null

  for (const radar of placed) {
    const r = enuOffset(site, radar.position!)
    const rangeM = radar.config.rangeKm * 1000
    const ceilingM = radar.config.ceilingM

    for (const p of flight.trajectory) {
      if (p.z > ceilingM) continue // au-dessus du plafond radar
      // Distance 2D (sol) entre le radar et la fusée, en mètres.
      const dist = Math.hypot(p.x - r.east, p.y - r.north)
      if (dist <= rangeM) {
        // Premier point accroché pour ce radar → préavis = impact − t.
        const leadSec = Math.max(0, impactTime - p.t)
        if (!best || leadSec > best.leadSec) {
          best = { leadSec, acqKm: dist / 1000, acqTime: p.t }
        }
        break // on garde la PREMIÈRE accroche de ce radar
      }
    }
  }

  if (!best) {
    return {
      ...emptyResult(totalThreats, 'The King never entered any radar coverage.'),
      verdict: 'missed',
      detectedCount: 0,
    }
  }

  const threshold = placed[0].config.detectionThresholdSec ?? 30
  const verdict: MissionVerdict = best.leadSec >= threshold ? 'detected' : 'late'
  return {
    verdict,
    leadTimeSec: Math.round(best.leadSec),
    acquisitionDistanceKm: Math.round(best.acqKm * 10) / 10,
    detectedCount: 1,
    totalThreats,
    firstPossibleDetectionSec: Math.round(best.acqTime),
    decoyCostSec: 0,
    decoyBreakdown: [],
    cause:
      verdict === 'late'
        ? `Lock too late: ${Math.round(best.leadSec)} s warning vs ${threshold} s required.`
        : null,
  }
}

function emptyResult(totalThreats: number, cause: string): MissionResult {
  return {
    verdict: 'missed',
    leadTimeSec: null,
    acquisitionDistanceKm: null,
    detectedCount: 0,
    totalThreats,
    firstPossibleDetectionSec: null,
    decoyCostSec: null,
    decoyBreakdown: [],
    cause,
  }
}
