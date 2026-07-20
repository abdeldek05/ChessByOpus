import { useMemo } from 'react'
import * as THREE from 'three'
import { MesangeStatic } from './MesangeStatic'
import { MesangeDebris } from './MesangeDebris'
import { ImpactBurst } from './ImpactBurst'
import { ExhaustPlume } from './ExhaustPlume'
import { useTrajectoryPlayback } from '@/three/hooks/useTrajectoryPlayback'
import type { FlightData } from '@/lib/api'

interface FlyingMesangeProps {
  /** Vraie trajectoire RocketPy à rejouer (null = rien à animer). */
  flight: FlightData | null
  /** Origine scène (sommet de rampe) où démarre la trajectoire. */
  origin: THREE.Vector3
  /** Direction unitaire du nez au décollage (axe de la rampe). */
  initialDirection: THREE.Vector3
  /** Vol en cours : anime le tir ; false = rien affiché. */
  active: boolean
  /** Mètres réels → unités scène (map fixe, voir computeSceneScale). */
  metersPerSceneUnit: number
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
export function FlyingMesange({
  flight,
  origin,
  initialDirection,
  active,
  metersPerSceneUnit,
  onFlightFrame,
}: FlyingMesangeProps) {
  // Stabilise l'origine/direction (évite un nouveau Vector3 à chaque render → reset hook).
  const originStable = useMemo(() => origin.clone(), [origin.x, origin.y, origin.z])
  const directionStable = useMemo(
    () => initialDirection.clone(),
    [initialDirection.x, initialDirection.y, initialDirection.z],
  )

  const { groupRef, phase, thrusting, brokenElapsed, impact } = useTrajectoryPlayback({
    flight,
    active,
    origin: originStable,
    initialDirection: directionStable,
    metersPerSceneUnit,
    onFrame: onFlightFrame,
  })

  if (!active || !flight) return null

  return (
    <>
      {phase === 'flying' && (
        <group ref={groupRef}>
          {/* noFog : en altitude la fusée monte au-delà du fog (calé sur le
              rayon du terrain) — sans ça elle se noierait dans la brume.
              Échelle et orientation initiales gérées dans useTrajectoryPlayback
              (transition progressive, pas de saut). */}
          <MesangeStatic noFog />
          <ExhaustPlume thrustingRef={thrusting} />
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
