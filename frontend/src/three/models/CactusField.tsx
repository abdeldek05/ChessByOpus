import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three-stdlib'
import { useCactusInstances } from '@/three/hooks/useCactusInstances'
import { CACTUS } from '@/three/constants/desertField'

interface CactusFieldProps {
  /** Rayon de semis (= demi-terrain). */
  radius: number
}

/** Géométrie d'UN saguaro : tronc + calotte + deux bras en L, fusionnés. */
function buildCactusGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    // Tronc côtelé (peu de segments radiaux + flat shading = côtes stylisées).
    new THREE.CylinderGeometry(0.3, 0.4, 4.2, 9).translate(0, 2.1, 0),
    new THREE.SphereGeometry(0.3, 9, 6).translate(0, 4.2, 0),
    // Bras gauche (bas) : coude horizontal + segment vertical + calotte.
    new THREE.CylinderGeometry(0.19, 0.19, 0.8, 8).rotateZ(Math.PI / 2).translate(-0.55, 2.0, 0),
    new THREE.CylinderGeometry(0.19, 0.19, 1.5, 8).translate(-0.95, 2.75, 0),
    new THREE.SphereGeometry(0.19, 8, 6).translate(-0.95, 3.5, 0),
    // Bras droit (plus haut, plus court).
    new THREE.CylinderGeometry(0.17, 0.17, 0.7, 8).rotateZ(Math.PI / 2).translate(0.5, 2.7, 0),
    new THREE.CylinderGeometry(0.17, 0.17, 1.1, 8).translate(0.85, 3.25, 0),
    new THREE.SphereGeometry(0.17, 8, 6).translate(0.85, 3.8, 0),
  ]
  return mergeBufferGeometries(parts)!
}

/**
 * Champ de CACTUS du désert : saguaros procéduraux (tronc + deux bras) rendus
 * en un seul InstancedMesh — ~40 cactus pour un draw call. Placement dans le
 * hook (hors dalle/oasis, posés au ras des dunes) ; ici, rendu uniquement.
 */
export function CactusField({ radius }: CactusFieldProps) {
  const matrices = useCactusInstances(radius)
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const geometry = useMemo(() => buildCactusGeometry(), [])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <instancedMesh
      key={matrices.length}
      ref={meshRef}
      args={[geometry, undefined, matrices.length]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={CACTUS.color} roughness={0.85} metalness={0} flatShading />
    </instancedMesh>
  )
}
