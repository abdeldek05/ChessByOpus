import type { LaunchSite } from '@/types/simulation.types'
import type { RadarConfig } from '@/types/radar.types'
import type { MesangeLaunchConfig } from '@/types/mission.types'
import type { ScenarioRecord } from '@/types/scenario.types'
import type {
  MissionCreated,
  ScenarioCreated,
  SimulateRequest,
  SimulationResponse,
  MaxRangeRequest,
  MaxRangeResponse,
  MaxRangeQuickRequest,
  MaxRangeQuickResponse,
} from '@/types/api.types'

// Ré-export des contrats de données : les hooks/UI importent toujours ces types
// depuis `@/lib/api` (point d'entrée unique du back), leurs définitions vivent
// dans `@/types/api.types` (convention `*.types.ts`).
export type {
  MissionCreated,
  ScenarioCreated,
  RadarSpec,
  ThreatSpec,
  SimulateRequest,
  WeatherInfo,
  TrajectoryPoint,
  FlightData,
  SimulationStatus,
  SimulationResponse,
  MaxRangeRequest,
  MaxRangeRun,
  MaxRangeResponse,
  MaxRangeQuickRequest,
  MaxRangeQuickResponse,
} from '@/types/api.types'

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
// RocketPy. Le PREMIER appel d'un site est LENT (météo à froid) — 20 s ne
// suffisaient pas et le tir expirait (« ça ne se lance pas »), alors que le
// replay, météo réchauffée, passait. 45 s couvre le cas froid ; l'indicateur
// « Computing trajectory… » rassure pendant l'attente.
const SIMULATE_TIMEOUT_MS = 45000

// Enchaîne des dizaines de vols RocketPy (un par azimut/élévation) : plus long
// qu'un seul /simulate.
const MAX_RANGE_TIMEOUT_MS = 60000

// Quelques vols RocketPy (pas un balayage complet) : plus rapide que
// /simulate/max-range, mais dépasse largement le timeout par défaut.
const MAX_RANGE_QUICK_TIMEOUT_MS = 30000

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

/**
 * Balaie les azimuts sous la météo réelle du site (vent GFS) pour estimer,
 * par élévation de tir, la distance max au sol atteignable selon l'azimut
 * choisi par rapport au vent.
 */
export async function estimateMaxRange(payload: MaxRangeRequest): Promise<MaxRangeResponse> {
  return request<MaxRangeResponse>(
    '/simulate/max-range',
    { method: 'POST', body: JSON.stringify(payload) },
    MAX_RANGE_TIMEOUT_MS,
  )
}

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
