import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'

// Raideur de l'amorti : plus haut = suit le geste de plus près.
const DAMPING = 10

interface UseInclinationTiltResult {
  pivotRef: React.RefObject<THREE.Group | null>
}

/**
 * Fait pivoter un groupe autour de Z vers l'élévation cible avec un amorti
 * exponentiel : la fusée « suit » le geste avec une inertie douce au lieu de
 * sauter d'un angle à l'autre — c'est ce qui rend le réglage fluide à l'œil.
 * 90° = vertical (rotation nulle), en dessous elle penche vers +X.
 */
export function useInclinationTilt(inclinationDeg: number): UseInclinationTiltResult {
  const pivotRef = useRef<THREE.Group>(null)
  const currentRad = useRef(((90 - inclinationDeg) * Math.PI) / 180)

  useFrame((_, delta) => {
    const pivot = pivotRef.current
    if (!pivot) return
    const targetRad = ((90 - inclinationDeg) * Math.PI) / 180
    const blend = 1 - Math.exp(-DAMPING * delta)
    currentRad.current += (targetRad - currentRad.current) * blend
    pivot.rotation.z = -currentRad.current
  })

  return { pivotRef }
}
