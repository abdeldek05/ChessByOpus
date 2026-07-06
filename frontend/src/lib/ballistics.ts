import {
  GRAVITY_MS2,
  BURNOUT_SPEED_MS,
  METERS_PER_UNIT,
} from '@/three/constants/trajectory'

export interface BallisticParams {
  /** Azimut du tir (degrés) : 0 = Nord (-Z), 90 = Est (+X), sens horaire. */
  azimuthDeg: number
  /** Inclinaison au tir (degrés) : 90 = vertical, détermine la forme de l'arc. */
  inclinationDeg: number
  /** Vitesse de sortie (m/s). Défaut : BURNOUT_SPEED_MS. */
  speedMs?: number
}

export interface BallisticProfile {
  /** Durée totale de vol réelle (s), jusqu'au retour au sol. */
  flightTimeSec: number
  /** Portée au sol (m). */
  rangeM: number
  /** Altitude d'apogée (m). */
  apogeeM: number
}

export interface BallisticSample {
  /** Position dans la scène (unités), relative au pas de tir. */
  x: number
  y: number
  z: number
  altitudeM: number
  downrangeM: number
  /** Direction de la vitesse (scène, normalisée) pour orienter l'engin. */
  dirX: number
  dirY: number
  dirZ: number
  /** Norme de la vitesse (m/s). */
  speedMs: number
}

/**
 * Profil balistique d'un tir sous gravité : temps de vol, portée et apogée à
 * partir de l'inclinaison et de la vitesse de sortie (équations du projectile,
 * sans traînée). Pur et déterministe.
 */
export function computeBallisticProfile(params: BallisticParams): BallisticProfile {
  const v0 = params.speedMs ?? BURNOUT_SPEED_MS
  const theta = (params.inclinationDeg * Math.PI) / 180
  const sin = Math.sin(theta)
  return {
    flightTimeSec: (2 * v0 * sin) / GRAVITY_MS2,
    rangeM: (v0 * v0 * Math.sin(2 * theta)) / GRAVITY_MS2,
    apogeeM: (v0 * v0 * sin * sin) / (2 * GRAVITY_MS2),
  }
}

/**
 * Position et vitesse de l'engin à l'instant `tSec` (temps de vol réel, en
 * secondes) : mouvement d'un projectile sous gravité constante. L'altitude est
 * clampée à 0 (posé/impacté). Converti en unités de scène.
 */
export function sampleBallistic(tSec: number, params: BallisticParams): BallisticSample {
  const v0 = params.speedMs ?? BURNOUT_SPEED_MS
  const theta = (params.inclinationDeg * Math.PI) / 180
  const az = (params.azimuthDeg * Math.PI) / 180

  const vHoriz = v0 * Math.cos(theta)
  const horizM = vHoriz * tSec
  const vertM = Math.max(0, v0 * Math.sin(theta) * tSec - 0.5 * GRAVITY_MS2 * tSec * tSec)

  // Composantes de vitesse (m/s) : horizontale constante, verticale freinée.
  const vVert = v0 * Math.sin(theta) - GRAVITY_MS2 * tSec

  // Direction monde de la vitesse (avant normalisation).
  const dx = Math.sin(az) * vHoriz
  const dz = -Math.cos(az) * vHoriz
  const dy = vVert
  const dLen = Math.hypot(dx, dy, dz) || 1

  return {
    x: (Math.sin(az) * horizM) / METERS_PER_UNIT,
    y: vertM / METERS_PER_UNIT,
    z: (-Math.cos(az) * horizM) / METERS_PER_UNIT,
    altitudeM: vertM,
    downrangeM: horizM,
    dirX: dx / dLen,
    dirY: dy / dLen,
    dirZ: dz / dLen,
    speedMs: Math.hypot(vHoriz, vVert),
  }
}
