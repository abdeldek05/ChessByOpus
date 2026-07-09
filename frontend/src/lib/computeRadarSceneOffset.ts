import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

const EARTH_RADIUS_M = 6371000

/**
 * Échelle FIXE de la scène : 1 unité de scène = 200 m réels. Simulation d'exo,
 * pas de jeu : la distance affichée doit toujours être la vraie distance, à une
 * échelle constante et connue — jamais compressée « pour faire joli ». À 1:200,
 * 80 km = 400 unités, ce qui tient sur la pelouse de base ; au-delà le radar
 * s'éloigne réellement et c'est le terrain/la caméra qui suivent (cf.
 * LaunchSceneCanvas), on ne triche pas sur la position.
 */
export const METERS_PER_SCENE_UNIT = 200

// Le radar ne se colle jamais physiquement sur le banc de tir (rayon minimal en
// unités de scène). Purement anti-chevauchement, sans effet sur l'échelle.
const MIN_RADAR_SCENE_RADIUS = 22

export interface SceneOffset {
  x: number
  z: number
  /** Rayon scène du radar (unités) — sert au cadrage terrain/caméra. */
  sceneRadius: number
}

/**
 * Convertit la position GPS du radar en décalage 3D relatif au banc de tir, à
 * l'échelle FIXE 1:200. Orientation : Est → +x, Nord → -z (convention Three.js).
 * Direction ET distance sont géographiquement exactes. Seul un plancher
 * anti-chevauchement s'applique quand le radar est quasi sur le pas de tir.
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

  // Échelle stricte 1:200, avec seulement un plancher anti-chevauchement.
  const sceneRadius = Math.max(MIN_RADAR_SCENE_RADIUS, realDistance / METERS_PER_SCENE_UNIT)

  const dirX = realX / realDistance
  const dirZ = realZ / realDistance

  return {
    x: dirX * sceneRadius,
    z: -dirZ * sceneRadius,
    sceneRadius,
  }
}
