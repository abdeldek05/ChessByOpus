import type { RadarSpec, SimulateRequest, ThreatSpec } from '@/lib/api'
import type { RadarConfig } from '@/types/radar.types'
import type { RadarPosition, MesangeLaunchConfig } from '@/types/mission.types'
import type { LaunchSite } from '@/types/simulation.types'

/** Caractéristiques COMPLÈTES des radars posés → payload du moteur de détection. */
function buildRadarSpecs(radars: { config: RadarConfig; position: RadarPosition | null }[]): RadarSpec[] {
  return radars
    .filter((r) => r.position !== null)
    .map((r) => ({
      latitude: r.position!.latitude,
      longitude: r.position!.longitude,
      rangeKm: r.config.rangeKm,
      ceilingM: r.config.ceilingM,
      rotating: r.config.rotating,
      rotationRpm: r.config.rotationRpm ?? 40,
      minRcsM2: r.config.minDetectableRcsM2,
      antennaHeightM: r.config.antennaHeightM ?? 4,
      detectionThresholdSec: r.config.detectionThresholdSec ?? 30,
    }))
}

/** Menaces du scénario (Roi + leurres) → payload du moteur de détection. */
function buildThreatSpecs(mesangeConfigs: MesangeLaunchConfig[]): ThreatSpec[] {
  return mesangeConfigs.map((m) => ({
    role: m.role,
    azimuthDeg: m.azimuthDeg,
    launchDelaySec: m.launchDelaySec,
  }))
}

export interface BuildSimulatePayloadParams {
  site: LaunchSite
  radars: { config: RadarConfig; position: RadarPosition | null }[]
  mesangeConfigs: MesangeLaunchConfig[]
  /** Menace principale (Roi) : azimut + élévation envoyés à RocketPy. */
  king: MesangeLaunchConfig | undefined
  /** Température du site (météo) → densité de l'air côté simu ; omise = météo GFS réelle. */
  temperatureC?: number
}

/**
 * Construit le payload EXACT de `/simulate` à partir du scénario en cours —
 * fonction pure, partagée par le prefetch (voir stores/scenarioStore.ts) et le
 * lancement réel (useLaunchSequence), pour que les deux calculent TOUJOURS le
 * même payload à paramètres égaux (condition du cache prefetch).
 */
export function buildSimulatePayload({
  site,
  radars,
  mesangeConfigs,
  king,
  temperatureC,
}: BuildSimulatePayloadParams): SimulateRequest | null {
  if (!king) return null
  return {
    latitude: site.latitude,
    longitude: site.longitude,
    elevationDeg: king.inclinationDeg,
    azimuthDeg: king.azimuthDeg,
    siteElevationM: site.elevation,
    temperatureC,
    radars: buildRadarSpecs(radars),
    threats: buildThreatSpecs(mesangeConfigs),
  }
}
