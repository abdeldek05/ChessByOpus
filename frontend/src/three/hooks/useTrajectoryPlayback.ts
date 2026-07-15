import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { FlightData, TrajectoryPoint } from '@/lib/api'
import { sampleSceneGround } from '@/lib/sampleSceneGround'
import { PAD_TOP_Y } from '@/three/constants/launchComplex'
import { LAUNCH_CENTER, METERS_PER_SCENE_UNIT } from '@/three/constants/sceneLayout'
import type { SceneBiome } from '@/types/scene.types'
import { TIME_SCALE, LIFTOFF_REAL_SEC, LIFTOFF_TIME_SCALE, BURN_TIME_SEC } from '@/three/constants/flightPlayback'

export type PlaybackPhase = 'flying' | 'broken'

// Rigidité du lissage d'orientation du nez (slerp) : haut = suit vite la
// tangente, bas = plus amorti. Indépendant du framerate via 1-exp(-k·dt).
const HEADING_STIFFNESS = 7

interface UseTrajectoryPlaybackParams {
  flight: FlightData | null
  active: boolean
  /** Origine scène (sommet de rampe) où démarre la trajectoire. */
  origin: THREE.Vector3
  /** Biome du terrain (prairie/dunes) : détermine le sol de collision. */
  biome?: SceneBiome
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
 * Position scène d'un point de trajectoire, à la VRAIE échelle de la scène
 * (`METERS_PER_SCENE_UNIT`, partagée avec le radar dans
 * computeRadarSceneOffset) : un vol qui atterrit à 40 km du pas de tir finit
 * à 40 km de distance scène — plus de normalisation par vol qui recomprimait
 * chaque trajectoire dans un cadre fixe indépendamment de son ampleur réelle.
 * ENU RocketPy : x=est(+X), y=nord(-Z scène), z=altitude(+Y).
 */
function toScene(p: TrajectoryPoint, origin: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    origin.x + p.x / METERS_PER_SCENE_UNIT,
    origin.y + p.z / METERS_PER_SCENE_UNIT,
    origin.z - p.y / METERS_PER_SCENE_UNIT,
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
  biome = 'meadow',
  onFrame,
}: UseTrajectoryPlaybackParams): UseTrajectoryPlaybackResult {
  const groupRef = useRef<THREE.Group>(null)
  const animElapsed = useRef(0)
  const brokenElapsed = useRef(0)
  const thrusting = useRef(true)
  const [phase, setPhase] = useState<PlaybackPhase>('flying')

  // Rejeu d'un scénario (replay) : `flight` reçoit une NOUVELLE trajectoire à
  // chaque lancement, mais ce hook reste monté en permanence (le composant
  // parent retourne juste `null` sans démonter) — sans ce reset, `phase` et
  // les compteurs restent bloqués sur l'état du vol PRÉCÉDENT (ex. 'broken'
  // + débris déjà explosés), et le nouveau vol démarre déjà cassé.
  useEffect(() => {
    animElapsed.current = 0
    brokenElapsed.current = 0
    thrusting.current = true
    setPhase('flying')
  }, [flight])

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

  // Pré-calcule la spline (échelle réelle unique), les temps et l'impact au sol.
  const { curve, times, duration, impact } = useMemo(() => {
    if (!flight || flight.trajectory.length < 2) {
      return { curve: null, times: [] as number[], duration: 0, impact: origin.clone() }
    }
    const positions = flight.trajectory.map((p) => toScene(p, origin))
    const times = flight.trajectory.map((p) => p.t)

    // Spline centripète : passe par tous les points sans oscillation parasite.
    const curve = new THREE.CatmullRomCurve3(positions, false, 'centripetal')

    // Impact posé AU RAS du sol (relief OU dalle béton) : le dernier point de
    // trajectoire est ramené à la hauteur du sol. `sampleSceneGround` et
    // `positions` sont maintenant dans la MÊME échelle (METERS_PER_SCENE_UNIT
    // partagée) — plus besoin de reconvertir entre deux référentiels distincts.
    const last = positions[positions.length - 1]
    const impact = last.clone()
    const groundWorldY = sampleSceneGround(impact.x + LAUNCH_CENTER[0], impact.z + LAUNCH_CENTER[2], biome) - PAD_TOP_Y
    impact.y = origin.y + groundWorldY / METERS_PER_SCENE_UNIT

    return { curve, times, duration: flight.flightTimeSec, impact }
  }, [flight, origin, biome])

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

      // COLLISION avec le sol : en descente, dès que la fusée touche le relief
      // (collines comprises) OU la dalle béton, elle SE BRISE là — elle ne
      // traverse plus la map. (Sol et trajectoire dans la MÊME échelle réelle.)
      if (scratch.tangent.y < 0) {
        const groundWorldY =
          sampleSceneGround(scratch.pos.x + LAUNCH_CENTER[0], scratch.pos.z + LAUNCH_CENTER[2], biome) - PAD_TOP_Y
        const groundLocalY = origin.y + groundWorldY / METERS_PER_SCENE_UNIT
        if (scratch.pos.y <= groundLocalY + 0.4) {
          impact.set(scratch.pos.x, groundLocalY, scratch.pos.z)
          setPhase('broken')
          return
        }
      }

      thrusting.current = t <= BURN_TIME_SEC
      onFrame?.(scratch.pos, t / duration)
    } else {
      brokenElapsed.current += delta
    }
  })

  return { groupRef, phase, thrusting, brokenElapsed, impact }
}
