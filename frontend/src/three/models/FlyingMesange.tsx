import { useMemo } from 'react'
import * as THREE from 'three'
import { MesangeStatic } from './MesangeStatic'
import { MesangeDebris } from './MesangeDebris'
// import { ExhaustPlume } from './ExhaustPlume' // désactivé le temps de régler la trajectoire
import { useTrajectoryPlayback } from '@/three/hooks/useTrajectoryPlayback'
import { FLYING_ROCKET_SCALE } from '@/three/constants/flightPlayback'
import type { FlightData } from '@/lib/api'

interface FlyingMesangeProps {
  /** Vraie trajectoire RocketPy à rejouer (null = rien à animer). */
  flight: FlightData | null
  /** Origine scène (sommet de rampe) où démarre la trajectoire. */
  origin: THREE.Vector3
  /** Vol en cours : anime le tir ; false = rien affiché. */
  active: boolean
  /** Position monde de la fusée à chaque frame (caméra de suivi). */
  onFlightFrame?: (position: THREE.Vector3, progress: number) => void
}

/**
 * Mesange en vol : rejoue la VRAIE trajectoire RocketPy à un rythme visible
 * (décollage ralenti), AGRANDIE pour rester lisible à distance, avec un PANACHE
 * d'échappement en particules (flamme + fumée), puis se BRISE au sol à l'impact.
 * Orchestre le modèle, le panache et les débris ; l'interpolation vit dans le
 * hook. Remonte la position monde (caméra de suivi).
 */
export function FlyingMesange({ flight, origin, active, onFlightFrame }: FlyingMesangeProps) {
  // Stabilise l'origine (évite un nouveau Vector3 à chaque render → reset hook).
  const originStable = useMemo(() => origin.clone(), [origin.x, origin.y, origin.z])

  const { groupRef, phase, brokenElapsed, impact } = useTrajectoryPlayback({
    flight,
    active,
    origin: originStable,
    onFrame: onFlightFrame,
  })

  if (!active || !flight) return null

  return (
    <>
      {phase === 'flying' && (
        <group ref={groupRef} scale={FLYING_ROCKET_SCALE}>
          <MesangeStatic />
          {/* Panache d'échappement désactivé le temps de régler la trajectoire. */}
          {/* <ExhaustPlume thrustingRef={thrusting} /> */}
        </group>
      )}
      {phase === 'broken' && (
        <group position={impact}>
          <MesangeDebris elapsedRef={brokenElapsed} />
        </group>
      )}
    </>
  )
}
