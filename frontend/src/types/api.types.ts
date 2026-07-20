import type { MissionResult } from '@/types/missionResult.types'

// Contrats de données (DTO) échangés avec le back-end FastAPI. Séparés du client
// HTTP (`lib/api.ts`) : les types vivent ici (convention `*.types.ts`), le client
// les importe et les ré-exporte pour ne pas casser les imports existants.

export interface MissionCreated {
  id: number
  confirmedAt: string
}

export interface ScenarioCreated {
  id: number
  missionId: number
  createdAt: string
}

/** Caractéristiques complètes d'un radar posé, envoyées au moteur de détection. */
export interface RadarSpec {
  latitude: number
  longitude: number
  rangeKm: number
  ceilingM: number
  rotating: boolean
  rotationRpm: number
  minRcsM2: number
  antennaHeightM: number
  detectionThresholdSec: number
}

/** Une menace du scénario (Roi ou leurre) : rôle, cap et délai de tir. */
export interface ThreatSpec {
  role: string
  azimuthDeg: number
  launchDelaySec: number
}

export interface SimulateRequest {
  latitude: number
  longitude: number
  /** Angle de tir (deg, 90 = vertical). */
  elevationDeg: number
  /** Cap / azimut (deg). */
  azimuthDeg: number
  /** Altitude du site (m). */
  siteElevationM?: number
  /** Override manuel (°C) : si fourni, ignore la météo réelle du site. */
  temperatureC?: number
  /** Date/heure de tir (ISO 8601) : pilote la météo réelle (GFS) du lieu à cet instant. Défaut : maintenant. */
  launchDateTime?: string
  /** Radars posés : le moteur radar backend calcule la détection physique. */
  radars?: RadarSpec[]
  /** Menaces du scénario (Roi + leurres). */
  threats?: ThreatSpec[]
}

/** Météo effectivement utilisée par la simulation (vent au sol + source). */
export interface WeatherInfo {
  source: 'gfs' | 'standard_atmosphere'
  groundWindSpeedMs: number
  groundWindHeadingDeg: number
  groundTemperatureC: number
}

/** Un point de trajectoire : temps, position ENU (m), vitesse (m/s), cap et élévation instantanés (deg). */
export interface TrajectoryPoint {
  t: number
  x: number // est (m)
  y: number // nord (m)
  z: number // altitude sol (m)
  v: number // vitesse (m/s)
  azimuthDeg: number // cap du vecteur vitesse (0=nord, 90=est)
  elevationDeg: number // élévation du vecteur vitesse (90=vertical)
}

export interface FlightData {
  trajectory: TrajectoryPoint[]
  apogeeM: number
  apogeeTimeSec: number
  rangeM: number
  maxSpeedMs: number
  flightTimeSec: number
  weather: WeatherInfo
}

export type SimulationStatus = 'ready' | 'failed'

export interface SimulationResponse {
  status: SimulationStatus
  flight?: FlightData
  /** Bilan du moteur radar backend (null si aucun radar transmis). */
  detection?: MissionResult | null
  error?: string
}

export interface MaxRangeRequest {
  latitude: number
  longitude: number
  siteElevationM?: number
  /** Date/heure de tir (ISO 8601) : météo réelle (GFS) du lieu à cet instant. */
  launchDateTime?: string
  /** Élévations de tir à balayer (deg). Défaut backend : [90, 80, 70, 60, 45]. */
  elevationsDeg?: number[]
  /** Pas d'azimut du balayage (deg). Défaut backend : 15. */
  azimuthStepDeg?: number
}

/** Portée obtenue pour un couple (élévation, azimut) donné. */
export interface MaxRangeRun {
  elevationDeg: number
  azimuthDeg: number
  rangeM: number
  apogeeM: number
}

export interface MaxRangeResponse {
  status: SimulationStatus
  weather?: Pick<WeatherInfo, 'source' | 'groundWindSpeedMs' | 'groundWindHeadingDeg'>
  runs?: MaxRangeRun[]
  maxRange?: MaxRangeRun
  error?: string
}

export interface MaxRangeQuickRequest {
  latitude: number
  longitude: number
  siteElevationM?: number
  launchDateTime?: string
}

export interface MaxRangeQuickResponse {
  status: SimulationStatus
  maxRangeM?: number
  weather?: Pick<WeatherInfo, 'source' | 'groundWindSpeedMs' | 'groundWindHeadingDeg'>
  error?: string
}
