import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { FlightData, TrajectoryPoint } from '@/lib/api'
import {
  TARGET_FLIGHT_EXTENT,
  TIME_SCALE,
  LIFTOFF_REAL_SEC,
  LIFTOFF_TIME_SCALE,
  BURN_TIME_SEC,
} from '@/three/constants/flightPlayback'

export type PlaybackPhase = 'flying' | 'broken'

interface UseTrajectoryPlaybackParams {
  flight: FlightData | null
  active: boolean
  /** Origine scène (sommet de rampe) où démarre la trajectoire. */
  origin: THREE.Vector3
  /** Remontée de la position monde à chaque frame (caméra de suivi). */
  onFrame?: (position: THREE.Vector3, progress: number) => void
}

interface UseTrajectoryPlaybackResult {
  groupRef: React.RefObject<THREE.Group | null>
  phase: PlaybackPhase
  /** Moteur en poussée (flammes) : vrai pendant le burn (temps de vol réel). */
  thrusting: React.RefObject<boolean>
  brokenElapsed: React.RefObject<number>
  /** Point d'impact (fin de trajectoire) en coords scène. */
  impact: THREE.Vector3
}

/** Un point prêt pour le rejeu : temps réel + position scène normalisée. */
interface SamplePoint {
  t: number
  pos: THREE.Vector3
}

/**
 * Position scène d'un point de trajectoire. On NORMALISE par la plus grande
 * dimension du vol : `metersPerUnit` est choisi pour que max(apogée, portée)
 * occupe `TARGET_FLIGHT_EXTENT` unités. Ainsi le vol ENTIER tient dans le cadre
 * quel que soit l'angle (70° à plat comme 90° vertical), en gardant les BONNES
 * proportions. ENU RocketPy : x=est(+X), y=nord(-Z scène), z=altitude(+Y).
 */
function toScene(p: TrajectoryPoint, origin: THREE.Vector3, metersPerUnit: number): THREE.Vector3 {
  return new THREE.Vector3(
    origin.x + p.x / metersPerUnit,
    origin.y + p.z / metersPerUnit,
    origin.z - p.y / metersPerUnit,
  )
}

/**
 * Convertit le temps d'ANIMATION écoulé en temps de VOL RÉEL. On joue le temps
 * réel en accéléré (`TIME_SCALE`) — ce qui préserve la GRAVITÉ de RocketPy
 * (montée qui décélère, chute qui accélère) — avec un DÉCOLLAGE ralenti sur les
 * premières secondes pour bien voir la fusée quitter la rampe.
 */
function realTimeFromAnim(animT: number): number {
  const liftoffAnimDur = LIFTOFF_REAL_SEC / LIFTOFF_TIME_SCALE
  if (animT <= liftoffAnimDur) {
    return animT * LIFTOFF_TIME_SCALE
  }
  return LIFTOFF_REAL_SEC + (animT - liftoffAnimDur) * TIME_SCALE
}

/**
 * Rejoue la VRAIE trajectoire RocketPy en accéléré mais en TEMPS RÉEL : la fusée
 * décélère en montant, marque l'apogée, puis accélère en tombant — l'effet
 * gravité est naturel et le mouvement fluide. L'espace est normalisé par
 * l'apogée pour rester dans le cadre. Oriente le nez sur la tangente, signale la
 * poussée pendant le burn, bascule en 'broken' à l'impact.
 */
export function useTrajectoryPlayback({
  flight,
  active,
  origin,
  onFrame,
}: UseTrajectoryPlaybackParams): UseTrajectoryPlaybackResult {
  const groupRef = useRef<THREE.Group>(null)
  const animElapsed = useRef(0)
  const brokenElapsed = useRef(0)
  const thrusting = useRef(true)
  const [phase, setPhase] = useState<PlaybackPhase>('flying')

  // Pré-calcule l'échelle (normalisée apogée), les positions scène et l'impact.
  const { points, duration, impact } = useMemo(() => {
    if (!flight || flight.trajectory.length === 0) {
      return { points: [] as SamplePoint[], duration: 0, impact: origin.clone() }
    }
    // Mètres/unité tel que la plus grande dimension du vol (apogée OU portée)
    // occupe TARGET_FLIGHT_EXTENT unités → le vol entier tient dans le cadre.
    const extent = Math.max(1, flight.apogeeM, flight.rangeM)
    const metersPerUnit = extent / TARGET_FLIGHT_EXTENT
    const pts: SamplePoint[] = flight.trajectory.map((p) => ({
      t: p.t,
      pos: toScene(p, origin, metersPerUnit),
    }))
    return {
      points: pts,
      duration: flight.flightTimeSec,
      impact: pts[pts.length - 1].pos,
    }
  }, [flight, origin])

  const MODEL_UP = useMemo(() => new THREE.Vector3(0, 1, 0), [])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || !active || points.length === 0) return

    if (phase === 'flying') {
      animElapsed.current += Math.min(delta, 0.05) // borne : pas de saut si lag
      // Temps de vol réel correspondant (accéléré, décollage ralenti).
      const t = realTimeFromAnim(animElapsed.current)
      if (t >= duration) {
        setPhase('broken')
        return
      }

      // Interpolation linéaire entre les deux points encadrant t (temps réel).
      let i = 1
      while (i < points.length && points[i].t < t) i++
      const a = points[i - 1]
      const b = points[Math.min(i, points.length - 1)]
      const span = b.t - a.t || 1
      const f = Math.min(1, Math.max(0, (t - a.t) / span))
      const pos = a.pos.clone().lerp(b.pos, f)
      group.position.copy(pos)

      // Nez orienté sur la tangente (direction a→b).
      const heading = b.pos.clone().sub(a.pos)
      if (heading.lengthSq() > 1e-6) group.quaternion.setFromUnitVectors(MODEL_UP, heading.normalize())

      thrusting.current = t <= BURN_TIME_SEC
      onFrame?.(pos, t / duration)
    } else {
      brokenElapsed.current += delta
    }
  })

  return { groupRef, phase, thrusting, brokenElapsed, impact }
}
