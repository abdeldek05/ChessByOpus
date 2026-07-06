import type { LaunchSite } from '@/types/simulation.types'
import type { RadarConfig } from '@/types/radar.types'
import type { MesangeLaunchConfig, RadarPosition } from '@/types/mission.types'
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
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
): Promise<ScenarioCreated> {
  return request<ScenarioCreated>(`/missions/${missionId}/scenario`, {
    method: 'POST',
    body: JSON.stringify({
      radarTemplateId: radarConfig.templateId,
      radarRangeKm: radarConfig.rangeKm,
      radarCeilingM: radarConfig.ceilingM,
      radarRotating: radarConfig.rotating,
      radarMinRcsM2: radarConfig.minDetectableRcsM2,
      mesangeConfigs,
    }),
  })
}

export function listScenarios(): Promise<ScenarioRecord[]> {
  return request<ScenarioRecord[]>('/scenarios')
}

// --- Contrat de simulation (back RocketPy à venir) ---------------------------
// Le back calcule la trajectoire au moment de l'enregistrement du scénario ;
// le lancement récupère le résultat prêt. Cette forme est volontairement
// explicite pour que le back n'ait qu'à la remplir.

export interface LaunchRequest {
  scenarioId: number
  radarPosition: RadarPosition
}

export type SimulationStatus = 'pending' | 'ready' | 'failed'

export interface SimulationResult {
  scenarioId: number
  status: SimulationStatus
  /** Trajectoires calculées par le back (vide tant que le calcul n'est pas prêt). */
  trajectories: unknown[]
  /** Message d'erreur éventuel si status = 'failed'. */
  error?: string
}

/**
 * Déclenche/récupère la simulation d'un scénario enregistré. Tant que
 * l'endpoint n'existe pas côté back (404), on renvoie un résultat `pending`
 * plutôt que de faire échouer l'UI — le front est prêt, le back se branchera.
 */
export async function launchSimulation(payload: LaunchRequest): Promise<SimulationResult> {
  try {
    return await request<SimulationResult>(`/scenarios/${payload.scenarioId}/simulate`, {
      method: 'POST',
      body: JSON.stringify({ radarPosition: payload.radarPosition }),
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { scenarioId: payload.scenarioId, status: 'pending', trajectories: [] }
    }
    throw error
  }
}
