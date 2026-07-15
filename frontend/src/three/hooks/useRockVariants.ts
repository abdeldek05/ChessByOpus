import { useMemo } from 'react'
import * as THREE from 'three'
import { ROCK_NOISE_AMOUNT } from '@/three/constants/rocks'

/** PRNG déterministe (mulberry32) pour des formes reproductibles. */
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Génère `count` géométries de rocher DISTINCTES (icosaèdre déformé par sommet,
 * aplati) — une poignée de FORMES partagées, chacune instanciable en masse
 * (InstancedMesh), au lieu d'une géométrie par occurrence sur la map. Mémoïsé,
 * libéré au démontage.
 */
export function useRockVariants(count: number, baseRadius: number, seed: number): THREE.BufferGeometry[] {
  const geometries = useMemo(() => {
    const rng = makeRng(seed)
    const v = new THREE.Vector3()
    return Array.from({ length: count }, () => {
      const geo = new THREE.IcosahedronGeometry(baseRadius, 2)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i)
        const push = 1 + (rng() - 0.5) * 2 * ROCK_NOISE_AMOUNT
        v.multiplyScalar(push)
        v.y *= 0.7 // aplatissement : un rocher est plus large que haut.
        pos.setXYZ(i, v.x, v.y, v.z)
      }
      geo.computeVertexNormals()
      return geo
    })
  }, [count, baseRadius, seed])

  return geometries
}
