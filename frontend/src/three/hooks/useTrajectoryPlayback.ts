import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { FlightData, TrajectoryPoint } from '@/lib/api'
import { sampleLawnRelief } from '@/lib/sampleLawnRelief'
import { PAD_TOP_Y } from '@/three/constants/launchComplex'
import {
  TARGET_FLIGHT_EXTENT,
  TIME_SCALE,
  LIFTOFF_REAL_SEC,
  LIFTOFF_TIME_SCALE,
  BURN_TIME_SEC,
} from '@/three/constants/flightPlayback'

export type PlaybackPhase = 'flying' | 'broken'

// Rigidité du lissage d'orientation du nez (slerp) : haut = suit vite la
// tangente, bas = plus amorti. Indépendant du framerate via 1-exp(-k·dt).
const HEADING_STIFFNESS = 7

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
  /** Point d'impact posé AU RAS du relief (coords locales au groupe du pad). */
  impact: THREE.Vector3
}

/**
 * Position scène d'un point de trajectoire. On NORMALISE par la plus grande
 * dimension du vol : `metersPerUnit` est choisi pour que max(apogée, portée)
 * occupe `TARGET_FLIGHT_EXTENT` unités. Ainsi le vol ENTIER tient dans le cadre
 * quel que soit l'angle, en gardant les BONNES proportions. ENU RocketPy :
 * x=est(+X), y=nord(-Z scène), z=altitude(+Y).
 */
function toScene(p: TrajectoryPoint, origin: THREE.Vector3, metersPerUnit: number): THREE.Vector3 {
  return new THREE.Vector3(
    origin.x + p.x / metersPerUnit,
    origin.y + p.z / metersPerUnit,
    origin.z - p.y / metersPerUnit,
  )
}

/**
 * Convertit le temps d'ANIMATION écoulé en temps de VOL RÉEL : temps réel joué
 * en accéléré (`TIME_SCALE`) — la GRAVITÉ de RocketPy est préservée (montée qui
 * décélère, chute qui accélère) — avec un DÉCOLLAGE ralenti au départ.
 */
function realTimeFromAnim(animT: number): number {
  const liftoffAnimDur = LIFTOFF_REAL_SEC / LIFTOFF_TIME_SCALE
  if (animT <= liftoffAnimDur) {
    return animT * LIFTOFF_TIME_SCALE
  }
  return LIFTOFF_REAL_SEC + (animT - liftoffAnimDur) * TIME_SCALE
}

/**
 * Rejoue la VRAIE trajectoire RocketPy sur une SPLINE Catmull-Rom : position et
 * tangente parfaitement continues (fini les cassures entre échantillons), nez
 * lissé par slerp amorti, et AUCUNE allocation par frame (temporaires réutilisés
 * → pas de micro-saccades GC). Le temps réel est joué en accéléré (gravité
 * préservée), l'impact est posé au ras du relief. Bascule en 'broken' à la fin.
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

  // Temporaires réutilisés chaque frame (zéro allocation en régime permanent).
  const scratch = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      desiredQuat: new THREE.Quaternion(),
      up: new THREE.Vector3(0, 1, 0),
    }),
    [],
  )

  // Pré-calcule la spline (échelle normalisée), les temps et l'impact au sol.
  const { curve, times, duration, impact } = useMemo(() => {
    if (!flight || flight.trajectory.length < 2) {
      return { curve: null, times: [] as number[], duration: 0, impact: origin.clone() }
    }
    // Mètres/unité tel que la plus grande dimension du vol (apogée OU portée)
    // occupe TARGET_FLIGHT_EXTENT unités → le vol entier tient dans le cadre.
    const extent = Math.max(1, flight.apogeeM, flight.rangeM)
    const metersPerUnit = extent / TARGET_FLIGHT_EXTENT

    const positions = flight.trajectory.map((p) => toScene(p, origin, metersPerUnit))
    const times = flight.trajectory.map((p) => p.t)

    // Spline centripète : passe par tous les points sans oscillation parasite.
    const curve = new THREE.CatmullRomCurve3(positions, false, 'centripetal')

    // Impact posé AU RAS du relief : le dernier point de trajectoire est ramené
    // à la hauteur du terrain (coordonnées locales au groupe surélevé du pad).
    const last = positions[positions.length - 1]
    const impact = last.clone()
    impact.y = sampleLawnRelief(impact.x, impact.z) - PAD_TOP_Y

    return { curve, times, duration: flight.flightTimeSec, impact }
  }, [flight, origin])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || !active || !curve || times.length < 2) return

    if (phase === 'flying') {
      const dt = Math.min(delta, 0.05) // borne : pas de saut si lag
      animElapsed.current += dt
      // Temps de vol réel correspondant (accéléré, décollage ralenti).
      const t = realTimeFromAnim(animElapsed.current)
      if (t >= duration) {
        setPhase('broken')
        return
      }

      // Paramètre spline u ∈ [0,1] : segment encadrant t + fraction locale.
      let i = 1
      while (i < times.length && times[i] < t) i++
      const a = times[i - 1]
      const b = times[Math.min(i, times.length - 1)]
      const span = b - a || 1
      const f = Math.min(1, Math.max(0, (t - a) / span))
      const u = (i - 1 + f) / (times.length - 1)

      // Position et tangente CONTINUES sur la spline (pas de cassure).
      curve.getPoint(u, scratch.pos)
      group.position.copy(scratch.pos)

      curve.getTangent(u, scratch.tangent)
      if (scratch.tangent.lengthSq() > 1e-6) {
        scratch.desiredQuat.setFromUnitVectors(scratch.up, scratch.tangent.normalize())
        // Nez lissé : slerp amorti indépendant du framerate.
        group.quaternion.slerp(scratch.desiredQuat, 1 - Math.exp(-HEADING_STIFFNESS * dt))
      }

      thrusting.current = t <= BURN_TIME_SEC
      onFrame?.(scratch.pos, t / duration)
    } else {
      brokenElapsed.current += delta
    }
  })

  return { groupRef, phase, thrusting, brokenElapsed, impact }
}
