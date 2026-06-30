import type { RefObject } from 'react'
import type * as THREE from 'three'
import { useFitCameraToObject } from '@/three/hooks/useFitCameraToObject'

interface CameraRigProps {
  targetRef: RefObject<THREE.Object3D | null>
}

export function CameraRig({ targetRef }: CameraRigProps) {
  useFitCameraToObject(targetRef)
  return null
}
