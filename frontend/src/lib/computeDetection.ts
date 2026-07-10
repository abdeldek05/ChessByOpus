import type { RadarConfig } from '@/types/radar.types'
import type { RadarPosition, MesangeLaunchConfig } from '@/types/mission.types'
import type { LaunchSite } from '@/types/simulation.types'
import type { MissionResult, MissionVerdict } from '@/types/missionResult.types'

/** Distance haversine (km) entre deux points lat/lng. */
function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180
  const lat1 = (a.latitude * Math.PI) / 180
  const lat2 = (b.latitude * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Modèle de détection SIMPLE et autonome (km réels, indépendant du rendu). La
// Mesange suit une trajectoire balistique estimée en km à partir de son azimut
// et de son élévation ; on regarde si le radar l'accroche : la fusée doit
// passer DANS sa portée horizontale ET sous son plafond. Verdict :
//   detected = accrochée avec un préavis ≥ seuil
//   late     = accrochée mais préavis < seuil
//   missed   = jamais dans le domaine (portée/plafond) du radar

// Paramètres balistiques réels approximés (Mesange V2, prédesign RocketPy).
const APOGEE_PER_ELEV_KM = 42 // apogée max (~vertical) en km
const RANGE_PER_ELEV_KM = 90 // portée horizontale max (~45°) en km
const FLIGHT_TIME_SEC = 180 // durée de vol totale approx (montée+descente)

interface FlightEstimate {
  apogeeKm: number
  rangeKm: number
  /** Cap de tir (deg) pour projeter l'impact. */
  azimuthDeg: number
}

/** Estime apogée + portée (km) selon l'élévation (physique balistique simple). */
function estimateFlight(azimuthDeg: number, inclinationDeg: number): FlightEstimate {
  const el = (inclinationDeg * Math.PI) / 180
  // Apogée max au vertical (sin), portée max vers 45° (sin 2θ).
  return {
    apogeeKm: APOGEE_PER_ELEV_KM * Math.sin(el),
    rangeKm: RANGE_PER_ELEV_KM * Math.sin(2 * el),
    azimuthDeg,
  }
}

/**
 * Point d'impact estimé (lat/lng) : le pas de tir décalé de `rangeKm` dans la
 * direction de l'azimut. Approx plate suffisante pour comparer aux radars.
 */
function impactPosition(site: LaunchSite, flight: FlightEstimate): RadarPosition {
  const az = (flight.azimuthDeg * Math.PI) / 180
  const dLat = (flight.rangeKm / 111) * Math.cos(az)
  const dLng = (flight.rangeKm / (111 * Math.cos((site.latitude * Math.PI) / 180))) * Math.sin(az)
  return { latitude: site.latitude + dLat, longitude: site.longitude + dLng }
}

/**
 * Calcule le bilan de détection à partir des radars posés et de la menace
 * principale (Roi). Le meilleur radar (celui qui accroche le plus tôt / avec le
 * plus grand préavis) donne le verdict. Fonction pure — tout en km.
 */
export function computeDetection(
  site: LaunchSite,
  radars: { config: RadarConfig; position: RadarPosition | null }[],
  mesangeConfigs: MesangeLaunchConfig[],
): MissionResult {
  const king = mesangeConfigs.find((m) => m.role === 'KING') ?? mesangeConfigs[0]
  const placed = radars.filter((r) => r.position !== null)
  const totalThreats = mesangeConfigs.length

  if (!king || placed.length === 0) {
    return emptyResult(totalThreats, 'No King threat or no radar placed.')
  }

  const flight = estimateFlight(king.azimuthDeg, king.inclinationDeg)
  const impact = impactPosition(site, flight)

  // Pour chaque radar : la trajectoire est-elle dans son domaine ? On échantillonne
  // le trajet pas de tir → impact et on garde le point le plus proche du radar.
  let best: { leadSec: number; acqKm: number } | null = null

  for (const radar of placed) {
    const pos = radar.position!
    const samples = 60
    let acquiredAt: number | null = null // fraction de vol [0..1] à l'accroche
    let acqDistKm = Infinity

    for (let i = 0; i <= samples; i++) {
      const f = i / samples
      // Position horizontale interpolée pas de tir → impact.
      const lat = site.latitude + (impact.latitude - site.latitude) * f
      const lng = site.longitude + (impact.longitude - site.longitude) * f
      // Altitude parabolique : 0 → apogée → 0.
      const altKm = flight.apogeeKm * 4 * f * (1 - f)
      // Sous le plafond radar ?
      if (altKm * 1000 > radar.config.ceilingM) continue
      // Distance horizontale radar → fusée.
      const distKm = distanceKm(pos, { latitude: lat, longitude: lng })
      // Dans la portée (avec pénalité RCS : petite cible = portée effective réduite).
      const rcsFactor = Math.min(1, Math.max(0.4, king ? 1 : 1)) // placeholder RCS neutre
      const effRange = radar.config.rangeKm * rcsFactor
      if (distKm <= effRange) {
        if (acquiredAt === null) acquiredAt = f
        acqDistKm = Math.min(acqDistKm, distKm)
      }
    }

    if (acquiredAt !== null) {
      // Préavis = temps entre l'accroche et l'impact (fin de vol).
      const leadSec = (1 - acquiredAt) * FLIGHT_TIME_SEC
      if (!best || leadSec > best.leadSec) best = { leadSec, acqKm: acqDistKm }
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
    firstPossibleDetectionSec: Math.round((1 - best.leadSec / FLIGHT_TIME_SEC) * FLIGHT_TIME_SEC),
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
