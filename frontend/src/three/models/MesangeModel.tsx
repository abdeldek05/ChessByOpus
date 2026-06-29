import { forwardRef, useImperativeHandle, useRef } from 'react'
import type * as THREE from 'three'
import { useMesangeScene } from '@/three/hooks/useMesangeScene'
import { useMesangeMaterialQuality } from '@/three/hooks/useMesangeMaterialQuality'
import { useAutoRotate } from '@/three/hooks/useAutoRotate'
import { usePointerTilt } from '@/three/hooks/usePointerTilt'
import { MESANGE_MODEL_PATH } from '@/three/constants/modelPaths'

const SPIN_SPEED_RAD_PER_SEC = 0.35
const MAX_POINTER_TILT_RAD = 0.12

export const MesangeModel = forwardRef<THREE.Group>(function MesangeModel(_, ref) {
  const { scene } = useMesangeScene(MESANGE_MODEL_PATH)
  const rootRef = useRef<THREE.Group>(null)
  const tiltRef = useRef<THREE.Group>(null)
  const spinRef = useRef<THREE.Group>(null)

  useMesangeMaterialQuality(scene)
  useAutoRotate(spinRef, SPIN_SPEED_RAD_PER_SEC)
  usePointerTilt(tiltRef, MAX_POINTER_TILT_RAD)
  useImperativeHandle(ref, () => rootRef.current as THREE.Group, [])

  return (
    <group ref={rootRef}>
      <group ref={tiltRef}>
        <group ref={spinRef}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  )
})
