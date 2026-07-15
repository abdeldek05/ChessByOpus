import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three-stdlib'
import { makeRng } from '@/lib/makeRng'
import { sampleTerrainHeight } from '@/lib/sampleTerrainHeight'
import { createGrassTexture } from '@/lib/createGrassTexture'
import { SCRUB, OASIS } from '@/three/constants/desertField'

interface DryScrubFieldProps {
  /** Rayon de semis (= demi-terrain). */
  radius: number
}

/**
 * Buissons SECS du désert : touffes paille très clairsemées (plans croisés
 * texturés, même technique que l'herbe de prairie mais palette sèche et densité
 * ~50× plus faible). Un seul InstancedMesh, passe opaque (alphaTest). Semis
 * déterministe, hors dalle et hors oasis, posé au ras des dunes.
 */
export function DryScrubField({ radius }: DryScrubFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const texture = useMemo(() => createGrassTexture(SCRUB.colors), [])

  // Géométrie : deux plans perpendiculaires, pivot ramené à la base.
  const geometry = useMemo(() => {
    const a = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)
    const b = new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2).translate(0, 0.5, 0)
    return mergeBufferGeometries([a, b])!
  }, [])

  const matrices = useMemo(() => {
    const area = Math.PI * radius * radius
    const count = Math.min(SCRUB.maxCount, Math.floor(area * SCRUB.density))
    const rng = makeRng(SCRUB.seed)
    const out: THREE.Matrix4[] = []
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)

    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(rng()) * radius
      const angle = rng() * Math.PI * 2
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      if (Math.max(Math.abs(x), Math.abs(z)) < SCRUB.padExclusion) continue
      if (Math.hypot(x - OASIS.x, z - OASIS.z) < OASIS.exclusionRadius) continue

      position.set(x, sampleTerrainHeight(x, z, 'desert'), z)
      quaternion.setFromAxisAngle(up, rng() * Math.PI * 2)
      const jitter = 1 + (rng() - 0.5) * 2 * SCRUB.jitter
      scale.set(SCRUB.width * jitter, SCRUB.height * jitter, SCRUB.width * jitter)
      out.push(new THREE.Matrix4().compose(position, quaternion, scale))
    }
    return out
  }, [radius])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices])

  useEffect(() => () => {
    geometry.dispose()
    texture.dispose()
  }, [geometry, texture])

  return (
    <instancedMesh key={matrices.length} ref={meshRef} args={[geometry, undefined, matrices.length]} receiveShadow>
      <meshStandardMaterial map={texture} alphaTest={0.4} side={THREE.DoubleSide} roughness={0.95} metalness={0} />
    </instancedMesh>
  )
}
