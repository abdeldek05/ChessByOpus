import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { MAX_FRAME_DELTA } from '@/three/constants/frameTiming'

/** Fait tourner un groupe en continu sur son axe vertical (Y). */
export function useAutoRotate(targetRef: RefObject<THREE.Object3D | null>, speedRadPerSec: number) {
  useFrame((_, delta) => {
    const target = targetRef.current
    if (target) target.rotation.y += Math.min(delta, MAX_FRAME_DELTA) * speedRadPerSec
  })
}
