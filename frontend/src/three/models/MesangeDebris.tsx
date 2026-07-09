import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  DEBRIS_PIECES,
  DEBRIS_GRAVITY,
  DEBRIS_FLOOR_Y,
  DEBRIS_COLORS,
} from '@/three/constants/mesangeDebris'

interface MesangeDebrisProps {
  /** Temps écoulé depuis l'impact (s), piloté par le hook de vol. */
  elapsedRef: React.RefObject<number>
}

/**
 * Éclats de la Mesange dispersés au point d'impact (placeholder). Chaque
 * fragment est éjecté dans sa direction, retombe sous gravité et s'immobilise
 * au sol, en tournant sur lui-même. Positions recalculées à chaque frame depuis
 * l'élapsed partagé — pas d'état React, purement visuel.
 */
export function MesangeDebris({ elapsedRef }: MesangeDebrisProps) {
  const refs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(() => {
    const t = elapsedRef.current
    DEBRIS_PIECES.forEach((piece, i) => {
      const mesh = refs.current[i]
      if (!mesh) return
      const dir = new THREE.Vector3(...piece.dir).normalize()
      // Position balistique du fragment : v0·t − ½g·t², plancher au sol.
      const y = Math.max(DEBRIS_FLOOR_Y, dir.y * piece.speed * t - 0.5 * DEBRIS_GRAVITY * t * t)
      mesh.position.set(dir.x * piece.speed * t, y, dir.z * piece.speed * t)
      // Tumbling : ralentit à mesure que le fragment se pose.
      const spin = y > DEBRIS_FLOOR_Y ? t * 6 : 0
      const axis = new THREE.Vector3(...piece.spinAxis).normalize()
      mesh.quaternion.setFromAxisAngle(axis, spin)
    })
  })

  return (
    <group>
      {DEBRIS_PIECES.map((piece, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m
          }}
          castShadow
        >
          <boxGeometry args={[piece.size, piece.size * 0.6, piece.size * 0.8]} />
          <meshStandardMaterial
            color={DEBRIS_COLORS[i % DEBRIS_COLORS.length]}
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}
