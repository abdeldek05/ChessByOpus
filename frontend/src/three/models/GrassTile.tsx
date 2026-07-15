import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { generateGrassTile } from '@/lib/generateGrassTile'
import type { SceneBiome } from '@/types/scene.types'

interface GrassTileProps {
  tileX: number
  tileZ: number
  biome: SceneBiome
  geometry: THREE.BufferGeometry
  material: THREE.Material
}

/**
 * Une TUILE d'herbe : son semis (généré une fois, déterministe par ses
 * coordonnées) rendu en UN InstancedMesh. Montée/démontée par le streaming
 * (useGrassTiles) au gré des déplacements de la caméra — géométrie/matériau
 * partagés, possédés par le parent (GrassField).
 */
export function GrassTile({ tileX, tileZ, biome, geometry, material }: GrassTileProps) {
  const matrices = useMemo(() => generateGrassTile(tileX, tileZ, biome), [tileX, tileZ, biome])
  const meshRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices])

  if (matrices.length === 0) return null

  return (
    <instancedMesh
      key={matrices.length}
      ref={meshRef}
      args={[geometry, material, matrices.length]}
      receiveShadow
    />
  )
}
