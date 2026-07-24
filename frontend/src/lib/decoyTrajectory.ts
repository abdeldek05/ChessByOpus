import type { FlightData, TrajectoryPoint } from '@/lib/api'
import { GRAVITY_MS2, BURN_TIME_SEC } from '@/three/constants/flightPlayback'

// Même pas d'échantillonnage que le back (voir backend/simulate.py
// SAMPLE_DT) : le rendu (spline Catmull-Rom de useTrajectoryPlayback) traite
// les vols du Roi et des leurres de façon identique, avec la même densité de
// points.
const SAMPLE_DT = 0.2

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

// --- PION : cloche parabolique fake, azimut réglé, aucune calibration ---

export interface PawnTrajectoryParams {
  azimuthDeg: number
  inclinationDeg: number
  /** Vol RÉEL RocketPy du Roi — sert uniquement de RÉFÉRENCE d'échelle (la
   *  portée du Pion est un multiple de la sienne, voir PAWN_RANGE_FACTOR) et
   *  de source de météo. Aucune intégration physique dérivée de son profil. */
  kingFlight: FlightData
}

// Durée d'ANIMATION du panache (s) — sert uniquement à piloter `thrusting`
// dans useTrajectoryPlayback (voir FlyingMesange), la trajectoire elle-même
// n'a plus de vraie « phase de poussée » (parabole analytique dès t=0).
export const PAWN_BURN_TIME_SEC = Math.min(BURN_TIME_SEC, 8)

// Portée cible du Pion : MULTIPLE de la portée réelle du Roi — un leurre de
// saturation doit aller au moins aussi loin que la menace réelle pour
// traverser la même couverture radar, avec une marge généreuse (fake assumé,
// pas de calibration physique fragile derrière ce chiffre).
const PAWN_RANGE_FACTOR = 1.3

// Ratio apogée/portée de la cloche : hauteur ≈ portée/3, un arc large et
// lisible plutôt qu'un tir tendu ou un chandelle trop pointue.
const PAWN_APOGEE_RATIO = 1 / 3

/**
 * Trajectoire d'un PION (leurre de saturation, doctrine CHESS) : une CLOCHE
 * PARABOLIQUE analytique dans l'axe de l'azimut réglé sur la carte — PAS une
 * intégration physique (fini la calibration fragile, la portée trop courte,
 * le piqué trop parabolique des versions précédentes). Formule fermée
 * z(s) = 4·H·(s/R)·(1−s/R), toujours lisse, jamais de cassure.
 *
 * Respecte STRICTEMENT l'azimut réglé (droit devant, doctrine confirmée —
 * le Pion ne vise jamais un radar, c'est à l'utilisateur de régler l'azimut
 * vers lui s'il veut qu'il le survole). `inclinationDeg` n'influence QUE la
 * proportion de la cloche visuelle (plus vertical = un peu plus haute/courte),
 * jamais l'angle de sortie réel — un Pion n'a pas de rampe de tir crédible à
 * simuler, juste une belle trajectoire fake.
 *
 * Le backend continue de le détecter via le vol du Roi tourné (voir
 * radar.py compute_detection) : décalage visuel/détection assumé pour un
 * leurre de saturation, la Dame seule (buildQueenTrajectory) doit matcher
 * exactement.
 *
 * Fonction pure et déterministe : mêmes paramètres → même trajectoire.
 */
export function buildPawnTrajectory({ azimuthDeg, inclinationDeg, kingFlight }: PawnTrajectoryParams): FlightData {
  const azimuthRad = degToRad(azimuthDeg)
  const dirX = Math.sin(azimuthRad) // est
  const dirY = Math.cos(azimuthRad) // nord

  const rangeM = Math.max(500, kingFlight.rangeM * PAWN_RANGE_FACTOR)
  // Inclinaison réglée : influence légèrement la proportion de la cloche
  // (plus vertical → un peu plus haute et un peu moins large), sans jamais
  // devenir un angle de tir réel — bornée pour rester une cloche lisible
  // quelle que soit la valeur réglée (45–90°).
  const inclinationFactor = Math.sin(degToRad(clampInclination(inclinationDeg)))
  const apogeeM = rangeM * PAWN_APOGEE_RATIO * inclinationFactor

  // Durée de vol FAKE : calée sur une chute libre depuis l'apogée (temps de
  // montée = temps de descente pour une parabole symétrique), donne un rythme
  // de vol crédible sans lien avec une vraie vitesse initiale.
  const halfTimeSec = Math.sqrt((2 * apogeeM) / GRAVITY_MS2)
  const flightTimeSec = Math.max(1, halfTimeSec * 2)

  const trajectory: TrajectoryPoint[] = []
  let t = 0
  let apogeeTimeSec = flightTimeSec / 2
  let apogeeSeen = 0

  while (t <= flightTimeSec) {
    const frac = t / flightTimeSec // ∈ [0,1]
    const s = rangeM * frac // distance parcourue au sol
    const z = Math.max(0, 4 * apogeeM * frac * (1 - frac)) // parabole fermée

    const x = dirX * s
    const y = dirY * s

    // Vitesse par dérivée analytique de la parabole (pas de différence finie
    // instable) : ds/dt et dz/dt de la paramétrisation ci-dessus.
    const dsdt = rangeM / flightTimeSec
    const dzdt = (4 * apogeeM * (1 - 2 * frac)) / flightTimeSec
    const vx = dirX * dsdt
    const vy = dirY * dsdt
    const vz = dzdt

    trajectory.push({
      t: round1(t),
      x: round1(x),
      y: round1(y),
      z: round1(z),
      v: round1(Math.hypot(vx, vy, vz)),
      azimuthDeg: round1(azimuthDeg),
      elevationDeg: round1((Math.atan2(vz, dsdt) * 180) / Math.PI),
    })

    if (z > apogeeSeen) {
      apogeeSeen = z
      apogeeTimeSec = t
    }
    t += SAMPLE_DT
  }

  const maxSpeedMs = trajectory.reduce((max, p) => Math.max(max, p.v), 0)

  return {
    trajectory,
    apogeeM: round1(apogeeSeen),
    apogeeTimeSec: round1(apogeeTimeSec),
    rangeM: round1(rangeM),
    maxSpeedMs: round1(maxSpeedMs),
    flightTimeSec: round1(flightTimeSec),
    weather: kingFlight.weather,
  }
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
