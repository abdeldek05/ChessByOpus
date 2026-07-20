import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useScatterInstances } from '@/three/hooks/useScatterInstances'
import { TREE, TREE_SCATTER } from '@/three/constants/trees'

/**
 * Arbres procéduraux SEMÉS sur toute la map (même pattern que RockField) :
 * tronc effilé + houppier en plusieurs amas de feuillage, réduits à DEUX
 * InstancedMesh (troncs, blobs) pour tenir des centaines d'arbres en 2 draw
 * calls. Positions/échelle/rotation du semis via `useScatterInstances`
 * (source de vérité du sol : sampleGroundHeight) ; chaque blob de feuillage
 * est dérivé de la matrice de son tronc.
 */
export function TreeField() {
  const trunkMatrices = useScatterInstances(TREE_SCATTER)

  // Géométrie tronc : cône effilé, pivot à la base (y ∈ [0, trunkHeight]).
  const trunkGeometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(TREE.trunkRadiusTop, TREE.trunkRadiusBottom, TREE.trunkHeight, 7)
    g.translate(0, TREE.trunkHeight / 2, 0)
    return g
  }, [])

  // Géométrie feuillage : icosaèdre légèrement déformé (touffu, pas une boule lisse).
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

  // Matrices des amas de feuillage : chaque tronc porte plusieurs blobs,
  // décalés/dimensionnés dans son propre repère (position + rotation + échelle).
  const blobMatrices = useMemo(() => {
    const matrices: THREE.Matrix4[] = []
    const trunkPos = new THREE.Vector3()
    const trunkQuat = new THREE.Quaternion()
    const trunkScale = new THREE.Vector3()
    const blobLocalPos = new THREE.Vector3()
    const blobWorldPos = new THREE.Vector3()
    const blobScale = new THREE.Vector3()
    const identity = new THREE.Quaternion()

    for (const trunkMatrix of trunkMatrices) {
      trunkMatrix.decompose(trunkPos, trunkQuat, trunkScale)
      for (const blob of TREE.blobs) {
        blobLocalPos.set(blob.off[0], TREE.trunkHeight + blob.off[1], blob.off[2])
        blobWorldPos.copy(blobLocalPos).applyQuaternion(trunkQuat).multiply(trunkScale).add(trunkPos)
        blobScale.setScalar(blob.r * trunkScale.x)
        matrices.push(new THREE.Matrix4().compose(blobWorldPos, identity, blobScale))
      }
    }
    return matrices
  }, [trunkMatrices])

  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const blobRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    const mesh = trunkRef.current
    if (!mesh) return
    trunkMatrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [trunkMatrices])

  useEffect(() => {
    const mesh = blobRef.current
    if (!mesh) return
    blobMatrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [blobMatrices])

  useEffect(
    () => () => {
      trunkGeometry.dispose()
      blobGeometry.dispose()
    },
    [trunkGeometry, blobGeometry],
  )

  return (
    <>
      {trunkMatrices.length > 0 && (
        <instancedMesh
          key={`trunks-${trunkMatrices.length}`}
          ref={trunkRef}
          args={[trunkGeometry, undefined, trunkMatrices.length]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={TREE.trunkColor} roughness={0.9} metalness={0} />
        </instancedMesh>
      )}

      {blobMatrices.length > 0 && (
        <instancedMesh
          key={`blobs-${blobMatrices.length}`}
          ref={blobRef}
          args={[blobGeometry, undefined, blobMatrices.length]}
          castShadow
        >
          <meshStandardMaterial color={TREE.leafColor} roughness={0.85} metalness={0} flatShading />
        </instancedMesh>
      )}
    </>
  )
}
