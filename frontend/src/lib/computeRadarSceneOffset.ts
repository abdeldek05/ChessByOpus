import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

const EARTH_RADIUS_M = 6371000

// Rayon utile de la pelouse (unités de scène) où le radar doit rester visible.
// LAWN_SIZE vaut 900 (bord à ±450) ; on garde le radar dans un disque de 400
// autour du banc de tir pour qu'il ne sorte jamais de l'herbe.
const MAX_RADAR_SCENE_RADIUS = 400
// Distance minimale (unités) : le radar ne se colle jamais sur le banc de tir.
const MIN_RADAR_SCENE_RADIUS = 22

export interface SceneOffset {
  x: number
  z: number
  /** Mètres réels par unité de scène effectivement appliqués (échelle adaptative). */
  metersPerUnit: number
}

/**
 * Convertit la position GPS du radar en décalage 3D relatif au banc de tir.
 *
 * Orientation : Est → +x, Nord → -z (convention Three.js). La DIRECTION est
 * toujours géographiquement exacte. La DISTANCE est compressée par une échelle
 * adaptative : au lieu d'une échelle fixe (qui projetait un radar lointain hors
 * de la pelouse), on borne le rayon scène à MAX_RADAR_SCENE_RADIUS et on en
 * déduit l'échelle mètres/unité — la scène reste lisible quelle que soit la
 * portée du radar, tout en conservant l'azimut réel.
 */
export function computeRadarSceneOffset(site: LaunchSite, radarPosition: RadarPosition): SceneOffset {
  const latRad = (site.latitude * Math.PI) / 180
  const dLat = ((radarPosition.latitude - site.latitude) * Math.PI) / 180
  const dLng = ((radarPosition.longitude - site.longitude) * Math.PI) / 180

  const realX = dLng * Math.cos(latRad) * EARTH_RADIUS_M
  const realZ = dLat * EARTH_RADIUS_M
  const realDistance = Math.hypot(realX, realZ)

  if (realDistance < 1) {
    return { x: 0, z: -MIN_RADAR_SCENE_RADIUS, metersPerUnit: 200 }
  }

  // Rayon scène borné : proportionnel jusqu'à saturation à MAX_RADAR_SCENE_RADIUS.
  const rawSceneRadius = realDistance / 200
  const sceneRadius = Math.min(
    MAX_RADAR_SCENE_RADIUS,
    Math.max(MIN_RADAR_SCENE_RADIUS, rawSceneRadius),
  )

  const dirX = realX / realDistance
  const dirZ = realZ / realDistance

  return {
    x: dirX * sceneRadius,
    z: -dirZ * sceneRadius,
    metersPerUnit: realDistance / sceneRadius,
  }
}
