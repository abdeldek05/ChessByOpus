import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface GrassChunkProps {
  /** Matrices des touffes de CE secteur angulaire. */
  matrices: THREE.Matrix4[]
  /** Géométrie partagée (plans croisés) — possédée par GrassField. */
  geometry: THREE.BufferGeometry
  /** Matériau partagé — possédé par GrassField. */
  material: THREE.Material
}

/**
 * Un SECTEUR d'herbe instanciée : un InstancedMesh borné à sa zone angulaire,
 * avec sa bounding sphere recalculée sur ses instances → le frustum culling ne
 * dessine que les secteurs réellement dans le champ de la caméra (gros gain,
 * rendu strictement identique). Géométrie/matériau partagés entre secteurs.
 */
export function GrassChunk({ matrices, geometry, material }: GrassChunkProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    // Sphère englobante du SECTEUR (pas de la géométrie unitaire) : culling juste.
    mesh.computeBoundingSphere()
  }, [matrices])

  return (
    <instancedMesh
      key={matrices.length}
      ref={meshRef}
      args={[geometry, material, matrices.length]}
      receiveShadow
    />
  )
}
