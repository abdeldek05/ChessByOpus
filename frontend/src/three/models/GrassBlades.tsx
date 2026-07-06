import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGrassBladeField } from '@/three/hooks/useGrassBladeField'
import { WIND_SPEED } from '@/three/constants/grassBlades'

/**
 * Brins d'herbe instanciés qui ondulent au vent, semés sur le relief autour du
 * banc de tir. La géométrie/le matériau/les matrices sont construits une seule
 * fois (useGrassBladeField) ; ce composant les monte sur un InstancedMesh et
 * avance l'uniform de temps du vent à chaque frame.
 */
export function GrassBlades() {
  const { geometry, material, instanceMatrices, count, windUniform } = useGrassBladeField()
  const meshRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.instanceMatrix = instanceMatrices
    mesh.instanceMatrix.needsUpdate = true
    mesh.castShadow = true
    mesh.receiveShadow = true
  }, [instanceMatrices])

  useFrame((_, delta) => {
    windUniform.value += delta * WIND_SPEED
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} frustumCulled={false} />
}
