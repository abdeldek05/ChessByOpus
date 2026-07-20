import * as THREE from 'three'

// Distance/hauteur à l'échelle du COMPLEXE de lancement (pas du terrain — cf.
// CAMERA_POSITION=[14,6,20] dans sceneLayout.ts, la référence « vue rapprochée »
// déjà utilisée ailleurs) : la scène se regarde de près (OrbitControls
// minDistance=5), un décalage à l'échelle de DETAIL_RADIUS (des milliers
// d'unités) noyait la fusée, minuscule, dans l'herbe au premier plan.
const BACK_DISTANCE = 24
const CAMERA_HEIGHT = 7

/**
 * Position caméra de départ (avant tout vol) qui reste TOUJOURS DIRECTEMENT
 * DERRIÈRE la fusée, quel que soit l'azimut de tir choisi. La direction
 * « avant » du vol dans le plan horizontal suit la MÊME convention que
 * computeRailRocketOrigin/LaunchRail (rotation Y de -azimuthRad, azimut nul =
 * nez vers -Z) : à azimut θ, l'avant horizontal vaut (sin θ, -cos θ) — la
 * caméra se place à l'opposé exact de ce vecteur, à distance et hauteur fixes,
 * à l'échelle du complexe (pas du terrain).
 */
export function computeLaunchCameraStart(azimuthDeg: number): [number, number, number] {
  const azimuthRad = THREE.MathUtils.degToRad(azimuthDeg)
  // Opposé de la direction avant (sin θ, -cos θ) → (-sin θ, cos θ).
  const backX = -Math.sin(azimuthRad)
  const backZ = Math.cos(azimuthRad)

  return [backX * BACK_DISTANCE, CAMERA_HEIGHT, backZ * BACK_DISTANCE]
}
