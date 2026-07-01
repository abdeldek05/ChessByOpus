import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

const EARTH_RADIUS_M = 6371000
// Échelle constante : 1 unité de scène = 200 m réels. Pas de plafond — la
// distance dans la scène reste proportionnelle à la distance réelle (un radar
// 2× plus loin apparaît 2× plus loin). La caméra et le sol s'adaptent.
const METERS_PER_SCENE_UNIT = 200

export interface SceneOffset {
  x: number
  z: number
}

/**
 * Convertit la position GPS du radar en décalage 3D relatif au site de
 * lancement, à l'échelle (proportionnelle). Ce n'est pas une reconstitution
 * géographique du terrain, mais la distance, elle, est respectée à l'échelle.
 */
export function computeRadarSceneOffset(site: LaunchSite, radarPosition: RadarPosition): SceneOffset {
  const latRad = (site.latitude * Math.PI) / 180
  const dLat = ((radarPosition.latitude - site.latitude) * Math.PI) / 180
  const dLng = ((radarPosition.longitude - site.longitude) * Math.PI) / 180
  const realX = dLng * Math.cos(latRad) * EARTH_RADIUS_M
  const realZ = dLat * EARTH_RADIUS_M

  return { x: realX / METERS_PER_SCENE_UNIT, z: -realZ / METERS_PER_SCENE_UNIT }
}
