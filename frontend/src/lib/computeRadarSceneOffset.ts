import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

const EARTH_RADIUS_M = 6371000

// Échelle de la distance radar dans la scène 3D, en RACINE (∝ √km). La 3D est
// une REPRÉSENTATION (pas une mesure) : la vraie distance en mètres vit sur la
// carte tactique 2D. La racine donne un CONTRASTE proche/loin marqué (un radar
// proche paraît vraiment proche, un lointain vraiment loin) tout en restant
// contenu sur la pelouse. L'ORDRE et les proportions relatives sont vrais ; la
// DIRECTION est géographiquement exacte.
//
//   rayon_scène = FACTEUR × √km
//
//   5 km → 107u · 20 km → 215u · 60 km → 372u · 150 km → 588u · 300 km → 831u
// Facteur relevé fort : le radar est nettement éloigné du pas de tir (le sol
// s'étend en conséquence, cf. LawnGround dans LaunchSceneCanvas).
const SCENE_RADIUS_PER_SQRT_KM = 48
// Plancher : le radar ne se colle jamais physiquement sur le banc de tir.
const MIN_RADAR_SCENE_RADIUS = 30

export interface SceneOffset {
  x: number
  z: number
  /** Rayon scène du radar (unités) — sert au cadrage caméra. */
  sceneRadius: number
}

/**
 * Décalage 3D du radar relatif au pas de tir, pour la SCÈNE (représentation).
 * Orientation : Est → +x, Nord → -z (convention Three.js). Direction exacte ;
 * distance à l'échelle LOGARITHMIQUE (ordre/proportions vrais, jamais hors
 * champ). La distance métrique exacte est portée par la carte 2D.
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

  const km = realDistance / 1000
  const sceneRadius = Math.max(MIN_RADAR_SCENE_RADIUS, SCENE_RADIUS_PER_SQRT_KM * Math.sqrt(km))

  const dirX = realX / realDistance
  const dirZ = realZ / realDistance

  return {
    x: dirX * sceneRadius,
    z: -dirZ * sceneRadius,
    sceneRadius,
  }
}
