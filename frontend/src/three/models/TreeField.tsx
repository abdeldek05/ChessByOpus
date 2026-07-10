import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useTreeInstances } from '@/three/hooks/useTreeInstances'
import { TREE } from '@/three/constants/trees'

/**
 * Forêt d'arbres instanciés : chaque arbre = un tronc effilé + plusieurs amas de
 * feuillage (houppier irrégulier), rendus en deux InstancedMesh (troncs +
 * feuillage) pour tenir des centaines d'arbres en deux draw calls. Feuillage en
 * icosaèdre légèrement déformé (touffu, pas une boule lisse). Placement/semis en
 * bosquets dans le hook.
 */
export function TreeField({ radius }: { radius: number }) {
  const { trunks, blobs } = useTreeInstances(radius)
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const blobRef = useRef<THREE.InstancedMesh>(null)

  // Tronc : cône effilé, pivot à la base (y ∈ [0, trunkHeight]).
  const trunkGeometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(
      TREE.trunkRadiusTop,
      TREE.trunkRadiusBottom,
      TREE.trunkHeight,
      7,
    )
    g.translate(0, TREE.trunkHeight / 2, 0)
    return g
  }, [])

  // Feuillage : icosaèdre (rayon 1) déformé pour un amas touffu irrégulier.
  const blobGeometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 1)
    const pos = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const push = 1 + (Math.sin(v.x * 7) * Math.cos(v.y * 6) + Math.sin(v.z * 8)) * 0.12
      v.multiplyScalar(push)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [])

  useEffect(() => {
    const mesh = trunkRef.current
    if (!mesh) return
    trunks.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
  }, [trunks])

  useEffect(() => {
    const mesh = blobRef.current
    if (!mesh) return
    blobs.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
  }, [blobs])

  useEffect(
    () => () => {
      trunkGeometry.dispose()
      blobGeometry.dispose()
    },
    [trunkGeometry, blobGeometry],
  )

  return (
    <group>
      <instancedMesh
        key={`trunks-${trunks.length}`}
        ref={trunkRef}
        args={[trunkGeometry, undefined, trunks.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={TREE.trunkColor} roughness={0.9} metalness={0} />
      </instancedMesh>

      <instancedMesh
        key={`blobs-${blobs.length}`}
        ref={blobRef}
        args={[blobGeometry, undefined, blobs.length]}
        castShadow
      >
        <meshStandardMaterial color={TREE.leafColor} roughness={0.85} metalness={0} flatShading />
      </instancedMesh>
    </group>
  )
}
