import type { LaunchSite } from '@/types/simulation.types'
import type { RadarConfig } from '@/types/radar.types'
import type { MesangeLaunchConfig } from '@/types/mission.types'
import type { ScenarioRecord } from '@/types/scenario.types'

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

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

export interface SimulateRequest {
  latitude: number
  longitude: number
  /** Angle de tir (deg, 90 = vertical). */
  elevationDeg: number
  /** Cap / azimut (deg). */
  azimuthDeg: number
  /** Altitude du site (m). */
  siteElevationM?: number
  /** Température au sol (°C) : influe sur la densité de l'air (traînée). */
  temperatureC?: number
}

/** Un point de trajectoire : temps, position ENU (m) et vitesse (m/s). */
export interface TrajectoryPoint {
  t: number
  x: number // est (m)
  y: number // nord (m)
  z: number // altitude sol (m)
  v: number // vitesse (m/s)
}

export interface FlightData {
  trajectory: TrajectoryPoint[]
  apogeeM: number
  apogeeTimeSec: number
  rangeM: number
  maxSpeedMs: number
  flightTimeSec: number
}

export type SimulationStatus = 'ready' | 'failed'

export interface SimulationResponse {
  status: SimulationStatus
  flight?: FlightData
  error?: string
}

/**
 * Lance la simulation de vol RocketPy pour un tir donné et renvoie la vraie
 * trajectoire (échantillonnée) + les métriques. Le calcul prend quelques
 * secondes côté back ; l'appel est donc synchrone et l'UI attend le résultat.
 */
export async function simulateFlight(payload: SimulateRequest): Promise<SimulationResponse> {
  return request<SimulationResponse>('/simulate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
