import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MesangeStatic } from './MesangeStatic'
import { MesangeDebris } from './MesangeDebris'
import { useMesangeFlight } from '@/three/hooks/useMesangeFlight'
import { ballisticStateAt, computeFlightDuration } from '@/lib/ballisticTrajectory'
import type { BallisticParams } from '@/lib/ballisticTrajectory'

interface FlyingMesangeProps {
  params: BallisticParams
  /** Vol en cours : anime le tir ; false = rien affiché. */
  active: boolean
  /** Position monde de la fusée à chaque frame (caméra de suivi + détection). */
  onFlightFrame?: (position: THREE.Vector3, progress: number) => void
}

/** Panache de flamme sous la fusée : cône émissif qui vacille, visible en poussée. */
function Flame({ thrustingRef }: { thrustingRef: React.RefObject<boolean> }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    const g = ref.current
    if (!g) return
    const on = thrustingRef.current
    g.visible = on
    if (on) {
      // Vacillement : longueur + largeur oscillent légèrement.
      const flick = 0.85 + Math.random() * 0.3
      g.scale.set(flick, 0.8 + Math.random() * 0.5, flick)
      g.rotation.y += delta * 4
    }
  })
  // La Mesange est dressée sur +Y, base vers le bas → flamme sous la base.
  return (
    <group ref={ref} position={[0, -3.2, 0]}>
      {/* Cœur clair */}
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.5, 2.6, 12]} />
        <meshStandardMaterial color="#fff2b0" emissive="#ffcf5a" emissiveIntensity={3} transparent opacity={0.95} />
      </mesh>
      {/* Halo externe orangé */}
      <mesh rotation={[Math.PI, 0, 0]} position={[0, 0.4, 0]}>
        <coneGeometry args={[0.85, 3.8, 12]} />
        <meshStandardMaterial color="#ff8a2a" emissive="#ff5a1a" emissiveIntensity={2} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

/**
 * Mesange en vol pendant la séquence de lancement : suit la trajectoire (poussée
 * → coast → chute), avec des FLAMMES sous la fusée pendant la poussée, puis se
 * BRISE au sol en fragments. Orchestre le modèle en vol, la flamme et les
 * débris ; la mécanique vit dans le hook. Remonte la position (caméra/détection).
 */
export function FlyingMesange({ params, active, onFlightFrame }: FlyingMesangeProps) {
  const { groupRef, phase, thrusting, brokenElapsed } = useMesangeFlight({
    params,
    active,
    onFlightFrame,
  })

  if (!active) return null

  // Point d'impact = position finale de la trajectoire (retour au sol).
  const impact = ballisticStateAt(computeFlightDuration(params), params).position

  return (
    <>
      {phase === 'flying' && (
        <group ref={groupRef}>
          <MesangeStatic />
          <Flame thrustingRef={thrusting} />
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
