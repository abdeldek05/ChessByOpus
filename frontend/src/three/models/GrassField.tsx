import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three-stdlib'
import { createGrassTexture } from '@/lib/createGrassTexture'
import { useGrassInstances } from '@/three/hooks/useGrassInstances'

interface GrassFieldProps {
  /** Rayon de semis (= tout le terrain visible) — l'herbe couvre toute la map. */
  radius: number
}

/**
 * Champ d'herbe instancié couvrant TOUT le terrain visible : chaque touffe est
 * un billboard en PLANS CROISÉS (deux quads perpendiculaires) texturé d'une
 * touffe alpha, ce qui donne du volume sous n'importe quel angle. Un seul draw
 * call pour des dizaines de milliers de touffes (InstancedMesh). Placement dans
 * le hook (densité constante sur le disque de rayon `radius`).
 */
export function GrassField({ radius }: GrassFieldProps) {
  const matrices = useGrassInstances(radius)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const texture = useMemo(() => createGrassTexture(), [])

  // Géométrie : deux plans perpendiculaires, pivot ramené à la base (y ∈ [0,1]).
  const geometry = useMemo(() => {
    const a = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)
    const b = new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2).translate(0, 0.5, 0)
    return mergeBufferGeometries([a, b])!
  }, [])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
  }, [matrices])

  useEffect(() => () => {
    geometry.dispose()
    texture.dispose()
  }, [geometry, texture])

  return (
    <instancedMesh
      key={matrices.length}
      ref={meshRef}
      args={[geometry, undefined, matrices.length]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        map={texture}
        transparent
        alphaTest={0.4}
        side={THREE.DoubleSide}
        roughness={0.9}
        metalness={0}
      />
    </instancedMesh>
  )
}
