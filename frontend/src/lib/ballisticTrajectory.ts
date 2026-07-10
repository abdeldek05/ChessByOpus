import * as THREE from 'three'

// Trajectoire de vol de la Mesange (modèle 3-DOF simplifié, à l'échelle scène).
// Inspiré du prédesign RocketPy : poussée CONSTANTE (~3500 N) pendant le burn,
// puis vol balistique sous gravité. Ici on travaille en unités de scène avec
// des constantes calées pour un vol LISIBLE qui va loin, tout en respectant la
// logique réelle : phase propulsée (accélération le long de l'axe de tir) →
// coast → chute. Direction pilotée par l'azimut et l'élévation choisis.

// --- Réglages du vol (échelle scène) ---
// Phase propulsée : la fusée accélère le long de son axe pendant BURN_SEC.
const BURN_SEC = 2.4
// Accélération pendant la poussée (unités/s²) — poussée forte, montée franche.
const THRUST_ACCEL = 95
// Vitesse initiale à la sortie de rampe (petite, la poussée fait le reste).
const RAIL_EXIT_SPEED = 8
// Gravité (unités/s²) : ramène la fusée au sol après le burn.
const GRAVITY = 22
// Traînée très légère (frein progressif) pour une descente crédible.
const DRAG = 0.015

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
  /** Vraie si le moteur pousse encore (pour les flammes). */
  thrusting: boolean
}

/** Axe de tir unitaire (direction de poussée) selon azimut + élévation. */
function launchAxis(azimuthDeg: number, inclinationDeg: number): THREE.Vector3 {
  const az = THREE.MathUtils.degToRad(azimuthDeg)
  const el = THREE.MathUtils.degToRad(inclinationDeg)
  const horizontal = Math.cos(el)
  return new THREE.Vector3(
    horizontal * Math.sin(az), // Est = +X
    Math.sin(el), // haut = +Y
    -horizontal * Math.cos(az), // Nord = -Z
  ).normalize()
}

/**
 * Intègre le vol pas à pas (Euler) et renvoie position/vitesse à l'instant t.
 * Phase 1 (t < BURN_SEC) : accélération le long de l'axe de tir + gravité.
 * Phase 2 : gravité + traînée seules. Simple, déterministe, suffisant pour la
 * visu (pas une intégration haute précision).
 */
function integrate(tSec: number, params: BallisticParams): { pos: THREE.Vector3; vel: THREE.Vector3 } {
  const axis = launchAxis(params.azimuthDeg, params.inclinationDeg)
  const pos = params.origin.clone()
  const vel = axis.clone().multiplyScalar(RAIL_EXIT_SPEED)
  const dt = 0.02
  const gravity = new THREE.Vector3(0, -GRAVITY, 0)

  for (let t = 0; t < tSec; t += dt) {
    const step = Math.min(dt, tSec - t)
    // Poussée le long de l'axe pendant le burn.
    if (t < BURN_SEC) vel.addScaledVector(axis, THRUST_ACCEL * step)
    // Gravité + traînée (freinage proportionnel à la vitesse).
    vel.addScaledVector(gravity, step)
    vel.addScaledVector(vel, -DRAG * step)
    pos.addScaledVector(vel, step)
    if (pos.y <= params.origin.y && t > BURN_SEC) {
      pos.y = params.origin.y
      break
    }
  }
  return { pos, vel }
}

/**
 * Durée totale du vol (mise à feu → retour au sol), par intégration jusqu'au
 * retour à l'altitude de départ. Dépend de l'élévation (portée/apogée) — donc
 * recalculée à chaque appel (léger, ~400 pas), pas mise en cache global.
 */
export function computeFlightDuration(params: BallisticParams): number {
  const dt = 0.02
  const axis = launchAxis(params.azimuthDeg, params.inclinationDeg)
  const pos = params.origin.clone()
  const vel = axis.clone().multiplyScalar(RAIL_EXIT_SPEED)
  const gravity = new THREE.Vector3(0, -GRAVITY, 0)
  let t = 0
  const maxT = 40
  while (t < maxT) {
    if (t < BURN_SEC) vel.addScaledVector(axis, THRUST_ACCEL * dt)
    vel.addScaledVector(gravity, dt)
    vel.addScaledVector(vel, -DRAG * dt)
    pos.addScaledVector(vel, dt)
    t += dt
    if (pos.y <= params.origin.y && t > BURN_SEC) break
  }
  return t
}

/** État du vol à l'instant `tSec` depuis la mise à feu. */
export function ballisticStateAt(tSec: number, params: BallisticParams): BallisticState {
  const duration = computeFlightDuration(params)
  const t = Math.min(tSec, duration)
  const { pos, vel } = integrate(t, params)
  const heading = vel.lengthSq() > 1e-6 ? vel.clone().normalize() : launchAxis(params.azimuthDeg, params.inclinationDeg)
  return {
    position: pos,
    heading,
    progress: t / duration,
    thrusting: t < BURN_SEC,
  }
}

/** Durée fixe utilisée par la séquence (fallback si params non intégrés). */
export const BALLISTIC_FLIGHT_DURATION_SEC = 8
/** Temps d'affichage des débris après l'impact avant de passer au bilan (s). */
export const BALLISTIC_DEBRIS_LINGER_SEC = 2.5
