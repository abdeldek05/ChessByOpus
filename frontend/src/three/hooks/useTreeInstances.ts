import { useMemo } from 'react'
import * as THREE from 'three'
import { sampleLawnRelief } from '@/lib/sampleLawnRelief'
import {
  TREE,
  TREE_COUNT,
  TREE_INNER_RADIUS,
  TREE_SEED,
  TREE_SIZE_JITTER,
} from '@/three/constants/trees'

export interface TreeInstances {
  /** Matrice de chaque tronc (posé au relief, échelle variée). */
  trunks: THREE.Matrix4[]
  /** Matrice de chaque amas de feuillage (5 par arbre). */
  blobs: THREE.Matrix4[]
}

/** PRNG déterministe (mulberry32). */
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
 * Matrices des troncs et des amas de feuillage, calculées une fois. Arbres semés
 * en bosquets (le bruit de position groupe les arbres) sur un anneau autour du
 * pas de tir, posés au ras du relief, taille et rotation variées. Purement
 * géométrique — le rendu (InstancedMesh) est ailleurs.
 *
 * @param radius rayon max de semis (= bord du terrain visible)
 */
export function useTreeInstances(radius: number): TreeInstances {
  return useMemo(() => {
    const rng = makeRng(TREE_SEED)
    const trunks: THREE.Matrix4[] = []
    const blobs: THREE.Matrix4[] = []

    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    const blobPos = new THREE.Vector3()
    const blobScale = new THREE.Vector3()
    const identity = new THREE.Quaternion()

    for (let i = 0; i < TREE_COUNT; i++) {
      // Semis en bosquets : on tire un centre de bosquet, puis un point autour.
      const clusterAngle = rng() * Math.PI * 2
      const clusterR = TREE_INNER_RADIUS + rng() * (radius - TREE_INNER_RADIUS)
      const cx = Math.cos(clusterAngle) * clusterR
      const cz = Math.sin(clusterAngle) * clusterR
      const spread = 18
      const x = cx + (rng() - 0.5) * spread
      const z = cz + (rng() - 0.5) * spread
      if (Math.hypot(x, z) < TREE_INNER_RADIUS) continue

      const y = sampleLawnRelief(x, z)
      const s = 1 + (rng() - 0.5) * 2 * TREE_SIZE_JITTER
      const yaw = rng() * Math.PI * 2

      // Tronc.
      pos.set(x, y, z)
      quat.setFromAxisAngle(up, yaw)
      scale.set(s, s, s)
      trunks.push(new THREE.Matrix4().compose(pos, quat, scale))

      // Amas de feuillage au sommet du tronc, décalés selon la silhouette.
      const topY = y + TREE.trunkHeight * s
      for (const blob of TREE.blobs) {
        const [ox, oy, oz] = blob.off
        // Rotation du décalage par le yaw de l'arbre pour de la variété.
        const rx = ox * Math.cos(yaw) - oz * Math.sin(yaw)
        const rz = ox * Math.sin(yaw) + oz * Math.cos(yaw)
        blobPos.set(x + rx * s, topY + oy * s, z + rz * s)
        const br = blob.r * s * (0.85 + rng() * 0.3)
        blobScale.set(br, br, br)
        blobs.push(new THREE.Matrix4().compose(blobPos, identity, blobScale))
      }
    }

    return { trunks, blobs }
  }, [radius])
}
