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

// Largeur (s d'animation) de la fenêtre de transition douce du facteur
// d'accélération LIFTOFF_TIME_SCALE → TIME_SCALE autour de la fin du décollage
// ralenti. Sans elle, le facteur PASSAIT d'un coup de 2.5 à 5 à cet instant :
// la vitesse écran de la fusée DOUBLAIT en une frame (secousse nette pile après
// le décollage, la fusée étant alors en plein boost). Une rampe lisse le coude.
const RATE_BLEND_WIDTH = 0.5

/** Rampe douce (smoothstep) de 0 à 1 sur [edge0, edge1]. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Convertit le temps d'ANIMATION écoulé en temps de VOL RÉEL : temps réel joué
 * en accéléré (`TIME_SCALE`) — la GRAVITÉ de RocketPy est préservée (montée qui
 * décélère, chute qui accélère) — avec un DÉCOLLAGE ralenti au départ.
 *
 * Intègre analytiquement un FACTEUR d'accélération qui transite en DOUCEUR de
 * LIFTOFF_TIME_SCALE à TIME_SCALE sur une fenêtre [liftoffAnimDur, +
 * RATE_BLEND_WIDTH] (au lieu d'un saut sec) : la vitesse visuelle de la fusée
 * ne double plus instantanément à la fin du décollage — plus de secousse à ~1.6s.
 */
export function realTimeFromAnim(animT: number): number {
  const liftoffAnimDur = LIFTOFF_REAL_SEC / LIFTOFF_TIME_SCALE
  if (animT <= liftoffAnimDur) {
    return animT * LIFTOFF_TIME_SCALE
  }
  // Au-delà : temps réel accumulé pendant le décollage (= LIFTOFF_REAL_SEC),
  // plus l'intégrale du facteur qui monte doucement de LIFTOFF_TIME_SCALE à
  // TIME_SCALE. La fenêtre de mélange est intégrée numériquement (pas fin,
  // borné à quelques itérations car RATE_BLEND_WIDTH est court), le reste
  // analytiquement à TIME_SCALE constant.
  const overshoot = animT - liftoffAnimDur
  const blendEnd = Math.min(overshoot, RATE_BLEND_WIDTH)
  let realFromBlend = 0
  const steps = 8
  const h = blendEnd / steps
  for (let k = 0; k < steps; k++) {
    const a = liftoffAnimDur + (k + 0.5) * h
    const factor = LIFTOFF_TIME_SCALE + (TIME_SCALE - LIFTOFF_TIME_SCALE) * smoothstep(liftoffAnimDur, liftoffAnimDur + RATE_BLEND_WIDTH, a)
    realFromBlend += factor * h
  }
  const realAfterBlend = Math.max(0, overshoot - RATE_BLEND_WIDTH) * TIME_SCALE
  return LIFTOFF_REAL_SEC + realFromBlend + realAfterBlend
}
