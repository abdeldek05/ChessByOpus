import { useMemo } from 'react'
import * as THREE from 'three'
import { ROCK_NOISE_AMOUNT } from '@/three/constants/rocks'

/** PRNG déterministe (mulberry32) pour une forme de rocher reproductible. */
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
 * Géométrie de rocher procédurale : un icosaèdre subdivisé dont chaque sommet
 * est poussé aléatoirement le long de sa normale (bruit par sommet), puis
 * aplati vers le bas pour un aspect de pierre posée. Mémoïsé par seed+rayon.
 * Fonction géométrique pure — le rendu (mesh + matériau) est ailleurs.
 */
export function useRockGeometry(seed: number, radius: number): THREE.BufferGeometry {
  return useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(radius, 2)
    const rng = makeRng(seed)
    const pos = geo.attributes.position
    const v = new THREE.Vector3()

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      // Déformation irrégulière : pousse le sommet le long de son rayon.
      const push = 1 + (rng() - 0.5) * 2 * ROCK_NOISE_AMOUNT
      v.multiplyScalar(push)
      // Aplatissement vers le bas : un rocher est plus large que haut.
      v.y *= 0.7
      pos.setXYZ(i, v.x, v.y, v.z)
    }

    geo.computeVertexNormals()
    return geo
  }, [seed, radius])
}
