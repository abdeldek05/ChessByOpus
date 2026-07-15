import type { LaunchSite } from '@/types/simulation.types'
import type { RadarConfig } from '@/types/radar.types'
import type { MesangeLaunchConfig } from '@/types/mission.types'
import type { ScenarioRecord } from '@/types/scenario.types'
import type { MissionResult } from '@/types/missionResult.types'

// Client HTTP centralisé pour le back-end (FastAPI, proxifié sous /api).
// Un seul endroit sait comment parler au serveur : les hooks/UI passent par
// ici, ce qui garde le front prêt à évoluer avec le back (nouveaux endpoints,
// auth, gestion d'erreurs) sans dupliquer de `fetch` un peu partout.

const API_BASE = '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Délai max d'une requête : si le back est down/injoignable, le proxy Vite peut
// laisser la requête pendre indéfiniment. Sans ce garde-fou, l'UI reste figée
// (ex. bouton bloqué sur « Enregistrement »). Passé ce délai, on abandonne et
// on remonte une erreur → l'UI affiche « Échec — réessayer ».
const REQUEST_TIMEOUT_MS = 8000

// /simulate télécharge la météo réelle (GFS) du site en plus de lancer
// RocketPy : quelques secondes de plus qu'un simple aller-retour DB.
const SIMULATE_TIMEOUT_MS = 20000

async function request<T>(path: string, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    // Abort (timeout) ou erreur réseau → erreur explicite, pas de blocage.
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    throw new ApiError(aborted ? `Requête ${path} expirée` : `Réseau injoignable`, 0)
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw new ApiError(`Requête ${path} échouée`, response.status)
  }
  // 204 / corps vide toléré.
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export interface MissionCreated {
  id: number
  confirmedAt: string
}

export function createMission(site: LaunchSite): Promise<MissionCreated> {
  return request<MissionCreated>('/missions', {
    method: 'POST',
    body: JSON.stringify({
      siteId: site.id,
      siteName: site.name,
      latitude: site.latitude,
      longitude: site.longitude,
    }),
  })
}

export interface ScenarioCreated {
  id: number
  missionId: number
  createdAt: string
}

export function saveScenario(
  missionId: number,
  radarConfig: RadarConfig,
  mesangeConfigs: MesangeLaunchConfig[],
  detectionThresholdSec: number,
): Promise<ScenarioCreated> {
  return request<ScenarioCreated>(`/missions/${missionId}/scenario`, {
    method: 'POST',
    body: JSON.stringify({
      radarTemplateId: radarConfig.templateId,
      radarRangeKm: radarConfig.rangeKm,
      radarCeilingM: radarConfig.ceilingM,
      radarRotating: radarConfig.rotating,
      radarMinRcsM2: radarConfig.minDetectableRcsM2,
      detectionThresholdSec,
      mesangeConfigs,
    }),
  })
}

export function listScenarios(): Promise<ScenarioRecord[]> {
  return request<ScenarioRecord[]>('/scenarios')
}

// --- Contrat de simulation de vol (backend RocketPy) -------------------------
// Le backend lance RocketPy (POST /simulate) avec l'azimut, l'élévation, le site
// et sa météo, et renvoie la trajectoire échantillonnée + les métriques réelles.

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

/**
 * Lance la simulation de vol RocketPy pour un tir donné et renvoie la vraie
 * trajectoire (échantillonnée) + les métriques. Le calcul prend quelques
 * secondes côté back ; l'appel est donc synchrone et l'UI attend le résultat.
 */
export async function simulateFlight(payload: SimulateRequest): Promise<SimulationResponse> {
  return request<SimulationResponse>(
    '/simulate',
    { method: 'POST', body: JSON.stringify(payload) },
    SIMULATE_TIMEOUT_MS,
  )
}

// --- Estimation de portée max selon l'azimut du vent et l'élévation ---------

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

/**
 * Balaie les azimuts sous la météo réelle du site (vent GFS) pour estimer,
 * par élévation de tir, la distance max au sol atteignable selon l'azimut
 * choisi par rapport au vent.
 */
// Enchaîne des dizaines de vols RocketPy (un par azimut/élévation) : plus long
// qu'un seul /simulate.
const MAX_RANGE_TIMEOUT_MS = 60000

export async function estimateMaxRange(payload: MaxRangeRequest): Promise<MaxRangeResponse> {
  return request<MaxRangeResponse>(
    '/simulate/max-range',
    { method: 'POST', body: JSON.stringify(payload) },
    MAX_RANGE_TIMEOUT_MS,
  )
}

// --- Majorant rapide de portée max (carte de placement du radar) -----------

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

// Quelques vols RocketPy (pas un balayage complet) : plus rapide que
// /simulate/max-range, mais dépasse largement le timeout par défaut.
const MAX_RANGE_QUICK_TIMEOUT_MS = 30000

/**
 * Majorant rapide (toutes directions confondues) de la distance max
 * atteignable sous la météo réelle du site — affiché sur la carte de
 * placement du radar, avant que l'azimut/élévation de tir ne soient choisis.
 */
export async function estimateMaxRangeQuick(payload: MaxRangeQuickRequest): Promise<MaxRangeQuickResponse> {
  return request<MaxRangeQuickResponse>(
    '/simulate/max-range-quick',
    { method: 'POST', body: JSON.stringify(payload) },
    MAX_RANGE_QUICK_TIMEOUT_MS,
  )
}
