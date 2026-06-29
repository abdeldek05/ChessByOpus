import type { RefObject } from 'react'
import type * as THREE from 'three'
import { useFitCameraToObject } from '@/three/hooks/useFitCameraToObject'

interface CameraRigProps {
  targetRef: RefObject<THREE.Object3D | null>
  verticalLookOffsetRatio?: number
}

export function CameraRig({ targetRef, verticalLookOffsetRatio = 0 }: CameraRigProps) {
  useFitCameraToObject(targetRef, verticalLookOffsetRatio)
  return null
}
