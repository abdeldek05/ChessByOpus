import { forwardRef, useImperativeHandle, useRef } from 'react'
import type * as THREE from 'three'
import { useCenteredScene } from '@/three/hooks/useCenteredScene'
import { useAutoRotate } from '@/three/hooks/useAutoRotate'
import { useMaterialTint } from '@/three/hooks/useMaterialTint'

const SPIN_SPEED_RAD_PER_SEC = 0.5

interface RadarModelProps {
  modelPath: string
  tintColor?: string
}

export const RadarModel = forwardRef<THREE.Group, RadarModelProps>(function RadarModel(
  { modelPath, tintColor },
  ref,
) {
  const { scene } = useCenteredScene(modelPath)
  const rootRef = useRef<THREE.Group>(null)
  const spinRef = useRef<THREE.Group>(null)

  useMaterialTint(scene, tintColor)
  useAutoRotate(spinRef, SPIN_SPEED_RAD_PER_SEC)
  useImperativeHandle(ref, () => rootRef.current as THREE.Group, [])

  return (
    <group ref={rootRef}>
      <group ref={spinRef}>
        <primitive object={scene} />
      </group>
    </group>
  )
})
