import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

const EARTH_RADIUS_M = 6371000

export interface EnuOffset {
  /** Décalage Est (m) du radar par rapport au pas de tir. */
  eastM: number
  /** Décalage Nord (m). */
  northM: number
}

/**
 * Position ENU (mètres Est/Nord) du radar relative au pas de tir — MÊME
 * approximation équirectangulaire que computeRadarSceneOffset (scène 3D) et
 * que la trajectoire RocketPy (x=est, y=nord) : toutes les couches (scène,
 * coupe Thales, couverture) partagent le même référentiel métrique.
 */
export function computeRadarEnu(site: LaunchSite, position: RadarPosition): EnuOffset {
  const latRad = (site.latitude * Math.PI) / 180
  const dLat = ((position.latitude - site.latitude) * Math.PI) / 180
  const dLng = ((position.longitude - site.longitude) * Math.PI) / 180
  return {
    eastM: dLng * Math.cos(latRad) * EARTH_RADIUS_M,
    northM: dLat * EARTH_RADIUS_M,
  }
}
