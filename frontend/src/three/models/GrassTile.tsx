import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { generateGrassTile } from '@/lib/generateGrassTile'

interface GrassTileProps {
  tileX: number
  tileZ: number
  geometry: THREE.BufferGeometry
  material: THREE.Material
}

/**
 * Une TUILE d'herbe : son semis (généré une fois, déterministe par ses
 * coordonnées) rendu en UN InstancedMesh. Montée/démontée par le streaming
 * (useGrassTiles) au gré des déplacements de la caméra — géométrie/matériau
 * partagés, possédés par le parent (GrassField).
 */
export function GrassTile({ tileX, tileZ, geometry, material }: GrassTileProps) {
  const matrices = useMemo(() => generateGrassTile(tileX, tileZ), [tileX, tileZ])
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
    // Pas de receiveShadow : l'herbe repose au même niveau que le sol juste en
    // dessous d'elle — recevoir SON ombre n'a pas de sens physique et causait
    // une acné d'ombre (taches noires sous chaque touffe). Elle reste ombrée
    // par les vrais objets qui la surplombent (fusée, pad, arbres).
    <instancedMesh key={matrices.length} ref={meshRef} args={[geometry, material, matrices.length]} />
  )
}
