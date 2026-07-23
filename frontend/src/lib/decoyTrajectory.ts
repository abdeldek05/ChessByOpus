import type { FlightData, TrajectoryPoint } from '@/lib/api'
import { GRAVITY_MS2, FALL_DRAG_COEFF, BURN_TIME_SEC } from '@/three/constants/flightPlayback'

// Même pas d'échantillonnage que le back (voir backend/simulate.py
// SAMPLE_DT) : le rendu (spline Catmull-Rom de useTrajectoryPlayback) traite
// les vols du Roi et des leurres de façon identique, avec la même densité de
// points.
const SAMPLE_DT = 0.2

/** Une frame d'intégration balistique (position + vitesse ENU, mètres/s). */
interface BallisticState {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

function pushSample(trajectory: TrajectoryPoint[], t: number, s: BallisticState): void {
  const horizSpeed = Math.hypot(s.vx, s.vy)
  trajectory.push({
    t: round1(t),
    x: round1(s.x),
    y: round1(s.y),
    z: round1(s.z),
    v: round1(Math.hypot(s.vx, s.vy, s.vz)),
    azimuthDeg: round1(((Math.atan2(s.vx, s.vy) * 180) / Math.PI + 360) % 360),
    elevationDeg: round1((Math.atan2(s.vz, horizSpeed) * 180) / Math.PI),
  })
}

// --- DAME : vol du Roi tourné vers son propre azimut --------------------

export interface QueenTrajectoryParams {
  azimuthDeg: number
  /** Vol RÉEL RocketPy du Roi — la Dame en est une COPIE tournée, pas un
   *  nouveau calcul (gratuit, aucun appel backend supplémentaire). */
  kingFlight: FlightData
}

/**
 * Tourne un point (est, nord) de `deltaAzimuthDeg` (sens HORAIRE) — transposé
 * de backend/radar.py `_rotate_track`, DOIT rester identique : c'est CETTE
 * même rotation que le backend applique pour détecter la Dame, donc le
 * visuel 3D doit matcher exactement ce que le radar "voit" (voir
 * compute_detection, où chaque leurre reprend le vol du Roi tourné vers son
 * azimut plutôt qu'une trajectoire indépendante).
 */
function rotateTrack(x: number, y: number, deltaAzimuthDeg: number): [number, number] {
  const a = (deltaAzimuthDeg * Math.PI) / 180
  const cosA = Math.cos(a)
  const sinA = Math.sin(a)
  return [x * cosA + y * sinA, -x * sinA + y * cosA]
}

/**
 * Trajectoire de la DAME (leurre premium, doctrine CHESS) : littéralement le
 * VOL DU ROI, tourné vers l'azimut réglé pour la Dame — même profil de
 * montée/chute, même durée, même vitesse, juste un cap différent. Cohérent
 * avec le backend (voir rotateTrack) : le radar détecte la Dame sur EXACTEMENT
 * cette trajectoire (avec en plus une SER boostée, voir radar.py
 * RCS_ROLE_MULTIPLIER) — pas de divergence visuel/détection comme pour un
 * Pion (voir buildPawnTrajectory).
 *
 * Fonction pure et déterministe : mêmes paramètres → même trajectoire.
 */
export function buildQueenTrajectory({ azimuthDeg, kingFlight }: QueenTrajectoryParams): FlightData {
  const kingAzimuthDeg = kingFlight.trajectory[1]?.azimuthDeg ?? kingFlight.trajectory[0]?.azimuthDeg ?? 0
  const deltaAzimuthDeg = azimuthDeg - kingAzimuthDeg

  if (Math.abs(deltaAzimuthDeg) < 1e-9) return kingFlight

  const trajectory = kingFlight.trajectory.map((p) => {
    const [x, y] = rotateTrack(p.x, p.y, deltaAzimuthDeg)
    return { ...p, x: round1(x), y: round1(y), azimuthDeg: round1(((p.azimuthDeg + deltaAzimuthDeg) % 360 + 360) % 360) }
  })

  return { ...kingFlight, trajectory }
}

// --- PION : balistique JS propre, azimut+inclinaison réglés -------------

export interface PawnTrajectoryParams {
  azimuthDeg: number
  inclinationDeg: number
  /** Vol RÉEL RocketPy du Roi — sert uniquement à caler la PUISSANCE (vitesse
   *  initiale déduite de son apogée réelle à sa propre inclinaison) : un
   *  Pion "hérite" de la puissance de la Mesange V2, mais vole à SON propre
   *  azimut/inclinaison réglés sur la carte, sans calibration de portance. */
  kingFlight: FlightData
}

// Durée de poussée d'un Pion (s) : accélération progressive dans l'axe de
// tir, PAS un choc de vitesse instantané. Plus courte que le vrai burn du Roi
// (BURN_TIME_SEC ≈ 35.7 s, RocketPy) : effet "jeu vidéo" léger, pas la
// simulation d'un vrai propulseur — un Pion est un leurre jetable de
// saturation, pas une réplique physique.
export const PAWN_BURN_TIME_SEC = Math.min(BURN_TIME_SEC, 8)

/**
 * Trajectoire d'un PION (leurre de saturation, doctrine CHESS) — PAS un vrai
 * vol RocketPy, PAS calé sur la trajectoire du Roi : une balistique JS SIMPLE
 * (poussée colinéaire à l'azimut/inclinaison réglés sur la carte, puis chute
 * libre avec traînée), qui va à une portée réaliste pour la puissance de la
 * Mesange V2. Contrairement à la Dame (voir buildQueenTrajectory), le Pion
 * respecte SON PROPRE réglage de carte plutôt que de copier le cap du Roi —
 * c'est un leurre jetable, pas une réplique crédible.
 *
 * Le backend continue de le détecter via le vol du Roi tourné (voir
 * radar.py compute_detection) : léger décalage visuel/détection assumé pour
 * un leurre de saturation, la Dame seule doit matcher exactement.
 *
 * Fonction pure et déterministe : mêmes paramètres → même trajectoire.
 */
export function buildPawnTrajectory({ azimuthDeg, inclinationDeg, kingFlight }: PawnTrajectoryParams): FlightData {
  const thetaKingRad = degToRad(clampInclination(inferKingInclinationDeg(kingFlight)))
  const thetaRad = degToRad(clampInclination(inclinationDeg))
  const azimuthRad = degToRad(azimuthDeg)

  // Vitesse initiale déduite de la PUISSANCE réelle du Roi : combien sa vraie
  // physique diverge du modèle balistique idéal SANS frottement, À SA PROPRE
  // inclinaison — appliqué tel quel à l'inclinaison du Pion pour hériter de
  // la même vraie puissance de la Mesange V2.
  const idealApogeeKing = Math.sin(thetaKingRad) ** 2
  const apogeeFactor = idealApogeeKing > 1e-6 ? kingFlight.apogeeM / idealApogeeKing : 0
  const targetApogeeM = Math.max(30, Math.sin(thetaRad) ** 2 * apogeeFactor)
  const vz0 = Math.sqrt(2 * GRAVITY_MS2 * targetApogeeM)
  const v0 = vz0 / Math.sin(thetaRad)

  const dirX = Math.sin(azimuthRad) // est
  const dirY = Math.cos(azimuthRad) // nord
  const thrustAccel = v0 / PAWN_BURN_TIME_SEC

  const state: BallisticState = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }
  const trajectory: TrajectoryPoint[] = [
    { t: 0, x: 0, y: 0, z: 0, v: 0, azimuthDeg: round1(azimuthDeg), elevationDeg: round1(inclinationDeg) },
  ]

  let t = 0
  let apogeeM = 0
  let apogeeTimeSec = 0
  let guard = 0
  const maxSteps = 5000
  while (guard < maxSteps) {
    if (t < PAWN_BURN_TIME_SEC) {
      // Poussée COLINÉAIRE à l'axe de tir (theta/azimuth), moins la gravité —
      // l'angle de sortie est GARANTI = l'inclinaison réglée sur la carte.
      state.vx += dirX * Math.cos(thetaRad) * thrustAccel * SAMPLE_DT
      state.vy += dirY * Math.cos(thetaRad) * thrustAccel * SAMPLE_DT
      state.vz += (Math.sin(thetaRad) * thrustAccel - GRAVITY_MS2) * SAMPLE_DT
    } else {
      // Chute libre classique après le burn : gravité + traînée isotrope.
      state.vz -= GRAVITY_MS2 * SAMPLE_DT
      if (state.vz < 0) {
        const speed = Math.hypot(state.vx, state.vy, state.vz)
        if (speed > 1e-4) {
          const dragMag = FALL_DRAG_COEFF * speed * speed * SAMPLE_DT
          const brake = Math.min(dragMag, speed) / speed
          state.vx -= state.vx * brake
          state.vy -= state.vy * brake
          state.vz -= state.vz * brake
        }
      }
    }
    state.x += state.vx * SAMPLE_DT
    state.y += state.vy * SAMPLE_DT
    state.z += state.vz * SAMPLE_DT
    t += SAMPLE_DT
    guard++

    if (state.z > apogeeM) {
      apogeeM = state.z
      apogeeTimeSec = t
    }
    pushSample(trajectory, t, state)

    // Borne de sécurité : le relief 3D réel décide de l'impact exact (voir
    // useTrajectoryPlayback) — cette boucle sert juste à fournir assez de
    // points sous z=0 pour que la spline ait de la matière à interpoler.
    if (t > apogeeTimeSec + 1 && state.z < -50) break
  }

  const rangeM = Math.hypot(state.x, state.y)
  const flightTimeSec = trajectory[trajectory.length - 1].t
  const maxSpeedMs = trajectory.reduce((max, p) => Math.max(max, p.v), 0)

  return {
    trajectory,
    apogeeM: round1(apogeeM),
    apogeeTimeSec: round1(apogeeTimeSec),
    rangeM: round1(rangeM),
    maxSpeedMs: round1(maxSpeedMs),
    flightTimeSec: round1(flightTimeSec),
    weather: kingFlight.weather,
  }
}

/** Retrouve l'inclinaison réelle du Roi depuis SA trajectoire (angle initial
 *  du vecteur vitesse) — le Roi ne porte pas son inclinationDeg ici, seul son
 *  FlightData est disponible à ce niveau. */
function inferKingInclinationDeg(kingFlight: FlightData): number {
  const first = kingFlight.trajectory[1] ?? kingFlight.trajectory[0]
  return first ? first.elevationDeg : 80
}

function clampInclination(deg: number): number {
  return Math.min(89, Math.max(5, deg))
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
