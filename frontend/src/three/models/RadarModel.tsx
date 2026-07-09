import { forwardRef, useImperativeHandle, useRef } from 'react'
import type * as THREE from 'three'
import { useCenteredScene } from '@/three/hooks/useCenteredScene'
import { useAutoRotate } from '@/three/hooks/useAutoRotate'
import { useMaterialTint } from '@/three/hooks/useMaterialTint'

const SPIN_SPEED_RAD_PER_SEC = 0.5

/** 'full' : tout le radar tourne (vitrine). 'none' : posé, statique (scène). */
export type RadarSpinMode = 'full' | 'none'

interface RadarModelProps {
  modelPath: string
  tintColor?: string
  shadows?: boolean
  /** Rayon englobant cible (unités scène) — règle la taille apparente du radar. */
  targetRadius?: number
  /** Rotation : vitrine (tout tourne) ou scène de lancement (statique). */
  spinMode?: RadarSpinMode
}

export const RadarModel = forwardRef<THREE.Group, RadarModelProps>(function RadarModel(
  { modelPath, tintColor, shadows = true, targetRadius = 3, spinMode = 'full' },
  ref,
) {
  const { scene } = useCenteredScene(modelPath, targetRadius, shadows)
  const rootRef = useRef<THREE.Group>(null)
  const spinRef = useRef<THREE.Group>(null)

  useMaterialTint(scene, tintColor)
  // Vitrine : tout le groupe tourne. Scène de lancement : radar posé, immobile.
  useAutoRotate(spinRef, SPIN_SPEED_RAD_PER_SEC, spinMode === 'full')
  useImperativeHandle(ref, () => rootRef.current as THREE.Group, [])

  return (
    <group ref={rootRef}>
      <group ref={spinRef}>
        <primitive object={scene} />
      </group>
    </group>
  )
})
