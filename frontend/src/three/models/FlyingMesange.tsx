import { useMemo } from 'react'
import * as THREE from 'three'
import { MesangeStatic } from './MesangeStatic'
import { MesangeDebris } from './MesangeDebris'
import { ImpactBurst } from './ImpactBurst'
// import { ExhaustPlume } from './ExhaustPlume' // désactivé le temps de régler la trajectoire
import { useTrajectoryPlayback } from '@/three/hooks/useTrajectoryPlayback'
import { FLYING_ROCKET_SCALE } from '@/three/constants/flightPlayback'
import type { FlightData } from '@/lib/api'
import type { SceneBiome } from '@/types/scene.types'

interface FlyingMesangeProps {
  /** Vraie trajectoire RocketPy à rejouer (null = rien à animer). */
  flight: FlightData | null
  /** Origine scène (sommet de rampe) où démarre la trajectoire. */
  origin: THREE.Vector3
  /** Vol en cours : anime le tir ; false = rien affiché. */
  active: boolean
  /** Biome du terrain (prairie/dunes) : sol de collision du crash. */
  biome?: SceneBiome
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
export function FlyingMesange({ flight, origin, active, biome, onFlightFrame }: FlyingMesangeProps) {
  // Stabilise l'origine (évite un nouveau Vector3 à chaque render → reset hook).
  const originStable = useMemo(() => origin.clone(), [origin.x, origin.y, origin.z])

  const { groupRef, phase, brokenElapsed, impact } = useTrajectoryPlayback({
    flight,
    active,
    origin: originStable,
    biome,
    onFrame: onFlightFrame,
  })

  if (!active || !flight) return null

  return (
    <>
      {phase === 'flying' && (
        <group ref={groupRef} scale={FLYING_ROCKET_SCALE}>
          {/* noFog : en altitude la fusée monte au-delà du fog (calé sur le
              rayon du terrain) — sans ça elle se noierait dans la brume. */}
          <MesangeStatic noFog />
          {/* Panache d'échappement désactivé le temps de régler la trajectoire. */}
          {/* <ExhaustPlume thrustingRef={thrusting} /> */}
        </group>
      )}
      {phase === 'broken' && (
        <group position={impact}>
          {/* Fragments physiques (rebonds) + flash/poussière/fumée d'impact. */}
          <MesangeDebris elapsedRef={brokenElapsed} />
          <ImpactBurst elapsedRef={brokenElapsed} />
        </group>
      )}
    </>
  )
}
