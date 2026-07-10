import type { RefObject } from 'react'
import type * as THREE from 'three'
import { useFitCameraToObject } from '@/three/hooks/useFitCameraToObject'

interface CameraRigProps {
  targetRef: RefObject<THREE.Object3D | null>
  /** Signal de reset du cadrage quand le modèle change (ex. templateId). */
  resetKey?: string
}

export function CameraRig({ targetRef, resetKey }: CameraRigProps) {
  useFitCameraToObject(targetRef, resetKey)
  return null
}
