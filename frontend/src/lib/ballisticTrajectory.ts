import * as THREE from 'three'

// Trajectoire balistique PLACEHOLDER (purement visuelle, pas de vraie physique
// de vol — celle-ci viendra du back/RocketPy). Une fusée partant du pas de tir
// avec un azimut et une élévation donnés : montée, apogée, descente sous l'effet
// d'une gravité constante, jusqu'au retour au sol. Fonction pure, unités scène.

// Réglages d'échelle scène pour un vol lisible (ni trop court, ni hors champ).
const FLIGHT_DURATION_SEC = 6 // durée totale montée + descente
const LAUNCH_SPEED = 42 // vitesse initiale (unités/s) — règle portée + apogée

export interface BallisticParams {
  /** Azimut de tir (deg) : 0 = Nord (-Z), 90 = Est (+X). */
  azimuthDeg: number
  /** Élévation (deg) : 90 = vertical, 70 = incliné. */
  inclinationDeg: number
  /** Point de départ (base de la rampe) en coordonnées scène. */
  origin: THREE.Vector3
}

export interface BallisticState {
  /** Position à l'instant t. */
  position: THREE.Vector3
  /** Cap de l'axe de la fusée (tangente à la trajectoire), normalisé. */
  heading: THREE.Vector3
  /** Fraction de vol écoulée [0..1] ; 1 = impact au sol. */
  progress: number
}

/** Durée totale du vol (s), pour caler la séquence sur l'animation. */
export const BALLISTIC_FLIGHT_DURATION_SEC = FLIGHT_DURATION_SEC

/**
 * Vecteur vitesse initial (unités/s) déduit de l'azimut + élévation. La gravité
 * est ensuite calée pour que le projectile retombe au sol pile à
 * FLIGHT_DURATION_SEC (parabole symétrique), quel que soit l'angle.
 */
function initialVelocity(azimuthDeg: number, inclinationDeg: number): THREE.Vector3 {
  const az = THREE.MathUtils.degToRad(azimuthDeg)
  const el = THREE.MathUtils.degToRad(inclinationDeg)
  const horizontal = LAUNCH_SPEED * Math.cos(el)
  return new THREE.Vector3(
    horizontal * Math.sin(az), // Est = +X
    LAUNCH_SPEED * Math.sin(el), // haut = +Y
    -horizontal * Math.cos(az), // Nord = -Z
  )
}

/**
 * État balistique à l'instant `tSec` depuis la mise à feu. La composante
 * verticale suit y = v0y·t − ½g·t², avec g choisi pour un retour au sol exact à
 * FLIGHT_DURATION_SEC. Au-delà, `progress` sature à 1 (impact).
 */
export function ballisticStateAt(tSec: number, params: BallisticParams): BallisticState {
  const v0 = initialVelocity(params.azimuthDeg, params.inclinationDeg)
  // g tel que la parabole retombe à y=0 quand t = FLIGHT_DURATION_SEC.
  const gravity = (2 * v0.y) / FLIGHT_DURATION_SEC
  const t = Math.min(tSec, FLIGHT_DURATION_SEC)

  const position = new THREE.Vector3(
    params.origin.x + v0.x * t,
    Math.max(0, params.origin.y + v0.y * t - 0.5 * gravity * t * t),
    params.origin.z + v0.z * t,
  )

  // Tangente = dérivée de la position : (v0x, v0y − g·t, v0z).
  const heading = new THREE.Vector3(v0.x, v0.y - gravity * t, v0.z).normalize()

  return { position, heading, progress: t / FLIGHT_DURATION_SEC }
}
