import * as THREE from 'three'
import type { TrajectoryPoint } from '@/types/api.types'
import { TIME_SCALE, LIFTOFF_REAL_SEC, LIFTOFF_TIME_SCALE } from '@/three/constants/flightPlayback'

/**
 * Position scène d'un point de trajectoire : mètres réels → unités scène via
 * `metersPerSceneUnit` (map FIXE, voir computeSceneScale — partagé avec le
 * radar) — la portée du vol occupe une fraction constante de la zone détaillée
 * quelle que soit sa distance réelle. ENU RocketPy : x=est(+X), y=nord(-Z
 * scène), z=altitude(+Y).
 */
export function toScene(
  p: TrajectoryPoint,
  origin: THREE.Vector3,
  metersPerSceneUnit: number,
): THREE.Vector3 {
  return new THREE.Vector3(
    origin.x + p.x / metersPerSceneUnit,
    origin.y + p.z / metersPerSceneUnit,
    origin.z - p.y / metersPerSceneUnit,
  )
}

/**
 * Convertit le temps d'ANIMATION écoulé en temps de VOL RÉEL : temps réel joué
 * en accéléré (`TIME_SCALE`) — la GRAVITÉ de RocketPy est préservée (montée qui
 * décélère, chute qui accélère) — avec un DÉCOLLAGE ralenti au départ.
 */
export function realTimeFromAnim(animT: number): number {
  const liftoffAnimDur = LIFTOFF_REAL_SEC / LIFTOFF_TIME_SCALE
  if (animT <= liftoffAnimDur) {
    return animT * LIFTOFF_TIME_SCALE
  }
  return LIFTOFF_REAL_SEC + (animT - liftoffAnimDur) * TIME_SCALE
}
