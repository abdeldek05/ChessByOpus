import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import { mergeBufferGeometries } from 'three-stdlib'
import { createGrassTexture } from '@/lib/createGrassTexture'
import { useOasisLayout } from '@/three/hooks/useOasisLayout'
import { PalmTree } from './PalmTree'
import { OASIS } from '@/three/constants/desertField'

/**
 * OASIS réaliste du désert : eau à VRAIES RÉFLEXIONS floutées
 * (MeshReflectorMaterial — palmiers et ciel se reflètent doucement), auréole de
 * SABLE MOUILLÉ sombre à la place du disque vert, ROSEAUX serrés au bord de
 * l'eau et couronne de palmiers-dattiers texturés. Implantation dans le hook.
 */
export function OasisPatch() {
  const { groundY, palms, reedMatrices } = useOasisLayout()
  const reedsRef = useRef<THREE.InstancedMesh>(null)

  // Roseaux : plans croisés + texture de touffe verte (celle de la prairie).
  const reedTexture = useMemo(() => createGrassTexture(), [])
  const reedGeometry = useMemo(() => {
    const a = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)
    const b = new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2).translate(0, 0.5, 0)
    return mergeBufferGeometries([a, b])!
  }, [])

  useEffect(() => {
    const mesh = reedsRef.current
    if (!mesh) return
    reedMatrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [reedMatrices])

  useEffect(
    () => () => {
      reedGeometry.dispose()
      reedTexture.dispose()
    },
    [reedGeometry, reedTexture],
  )

  return (
    <group>
      {/* Auréole de sable MOUILLÉ (sombre, satinée) autour de l'eau. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[OASIS.x, groundY + 0.08, OASIS.z]} receiveShadow>
        <circleGeometry args={[OASIS.ringOuter, 32]} />
        <meshStandardMaterial color={OASIS.wetSandColor} roughness={0.55} metalness={0} />
      </mesh>

      {/* Eau : réflexions réelles floutées (palmiers, ciel) — fini le miroir dur. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[OASIS.x, groundY + 0.18, OASIS.z]}>
        <circleGeometry args={[OASIS.waterRadius, 32]} />
        <MeshReflectorMaterial
          mirror={0.55}
          resolution={512}
          blur={[180, 60]}
          mixBlur={0.9}
          mixStrength={0.8}
          depthScale={0.3}
          minDepthThreshold={0.6}
          maxDepthThreshold={1.4}
          color={OASIS.waterColor}
          roughness={0.35}
          metalness={0}
        />
      </mesh>

      {/* Roseaux au bord de l'eau (un seul InstancedMesh, passe opaque). */}
      <instancedMesh
        key={reedMatrices.length}
        ref={reedsRef}
        args={[reedGeometry, undefined, reedMatrices.length]}
        receiveShadow
      >
        <meshStandardMaterial
          map={reedTexture}
          alphaTest={0.4}
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0}
        />
      </instancedMesh>

      {palms.map((palm, i) => (
        <PalmTree key={i} {...palm} />
      ))}
    </group>
  )
}
