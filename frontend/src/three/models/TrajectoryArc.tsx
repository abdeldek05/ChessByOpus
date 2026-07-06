import { useMemo } from 'react'
import * as THREE from 'three'
import { sampleBallistic, computeBallisticProfile } from '@/lib/ballistics'
import { DECK_TOP_Y, ROCKET_POSITION, ROCKET_FALLBACK_HALF_HEIGHT } from '@/three/constants/launcherRig'

interface TrajectoryArcProps {
  azimuthDeg: number
  inclinationDeg: number
  segments?: number
  color?: string
}

const ORIGIN = {
  x: ROCKET_POSITION.x,
  y: DECK_TOP_Y + ROCKET_FALLBACK_HALF_HEIGHT,
  z: ROCKET_POSITION.z,
}

/**
 * Arc de la trajectoire balistique de la menace, du pas de tir jusqu'à l'impact.
 * Géométrie mémoïsée (aucun recalcul par frame). Purement indicatif.
 */
export function TrajectoryArc({ azimuthDeg, inclinationDeg, segments = 90, color = '#ff5a4d' }: TrajectoryArcProps) {
  const geometry = useMemo(() => {
    const profile = computeBallisticProfile({ azimuthDeg, inclinationDeg })
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * profile.flightTimeSec
      const s = sampleBallistic(t, { azimuthDeg, inclinationDeg })
      points.push(new THREE.Vector3(ORIGIN.x + s.x, ORIGIN.y + s.y, ORIGIN.z + s.z))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [azimuthDeg, inclinationDeg, segments])

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color={color} transparent opacity={0.45} />
    </line>
  )
}
