import type { SimulateRequest } from '@/lib/api'

/** Précision (décimales) au-delà de laquelle deux coordonnées/angles sont
 *  considérés identiques pour le cache — élimine le bruit flottant sub-pixel
 *  sans perdre de précision utile (azimut/élévation réglés au dixième de degré). */
const ROUND_DECIMALS = 4

function round(value: number): number {
  const factor = 10 ** ROUND_DECIMALS
  return Math.round(value * factor) / factor
}

/**
 * Clé stable et déterministe pour un payload `/simulate` : deux payloads
 * équivalents (même site, mêmes radars/menaces, même température) produisent
 * TOUJOURS la même clé, quel que soit l'ordre de construction des objets —
 * condition nécessaire pour que le cache de prefetch (voir scenarioStore.ts)
 * retrouve un résultat déjà calculé plutôt que de le recalculer inutilement.
 */
export function buildSimulationCacheKey(payload: SimulateRequest): string {
  const normalized = {
    latitude: round(payload.latitude),
    longitude: round(payload.longitude),
    elevationDeg: round(payload.elevationDeg),
    azimuthDeg: round(payload.azimuthDeg),
    siteElevationM: payload.siteElevationM != null ? round(payload.siteElevationM) : 0,
    temperatureC: payload.temperatureC != null ? round(payload.temperatureC) : null,
    launchDateTime: payload.launchDateTime ?? null,
    radars: (payload.radars ?? [])
      .map((r) => ({ ...r, latitude: round(r.latitude), longitude: round(r.longitude) }))
      .sort((a, b) => a.latitude - b.latitude || a.longitude - b.longitude),
    threats: (payload.threats ?? [])
      .map((t) => ({ ...t, azimuthDeg: round(t.azimuthDeg) }))
      .sort((a, b) => a.role.localeCompare(b.role) || a.azimuthDeg - b.azimuthDeg),
  }
  return JSON.stringify(normalized)
}
