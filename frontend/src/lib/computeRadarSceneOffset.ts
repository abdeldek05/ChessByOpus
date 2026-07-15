import { METERS_PER_SCENE_UNIT } from '@/three/constants/sceneLayout'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

const EARTH_RADIUS_M = 6371000

// Plancher : le radar ne se colle jamais physiquement sur le banc de tir.
const MIN_RADAR_SCENE_RADIUS = 30

export interface SceneOffset {
  x: number
  z: number
  /** Rayon scène du radar (unités) — sert au cadrage caméra. */
  sceneRadius: number
}

/**
 * Décalage 3D du radar relatif au pas de tir, à la VRAIE échelle de la scène
 * (METERS_PER_SCENE_UNIT, partagée avec la trajectoire du vol dans
 * useTrajectoryPlayback) : un radar à 50 km est projeté à 50 km de distance
 * scène, pas compressé — c'est la caméra et le sol lointain (FarGround) qui
 * s'adaptent à l'échelle réelle, jamais la distance elle-même. Orientation :
 * Est → +x, Nord → -z (convention Three.js).
 */
export function computeRadarSceneOffset(site: LaunchSite, radarPosition: RadarPosition): SceneOffset {
  const latRad = (site.latitude * Math.PI) / 180
  const dLat = ((radarPosition.latitude - site.latitude) * Math.PI) / 180
  const dLng = ((radarPosition.longitude - site.longitude) * Math.PI) / 180

  const realX = dLng * Math.cos(latRad) * EARTH_RADIUS_M
  const realZ = dLat * EARTH_RADIUS_M
  const realDistance = Math.hypot(realX, realZ)

  if (realDistance < 1) {
    return { x: 0, z: -MIN_RADAR_SCENE_RADIUS, sceneRadius: MIN_RADAR_SCENE_RADIUS }
  }

  const sceneRadius = Math.max(MIN_RADAR_SCENE_RADIUS, realDistance / METERS_PER_SCENE_UNIT)

  const dirX = realX / realDistance
  const dirZ = realZ / realDistance

  return {
    x: dirX * sceneRadius,
    z: -dirZ * sceneRadius,
    sceneRadius,
  }
}
