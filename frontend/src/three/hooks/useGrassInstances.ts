import { useMemo } from 'react'
import * as THREE from 'three'
import { sampleLawnRelief } from '@/lib/sampleLawnRelief'
import {
  GRASS_DENSITY,
  GRASS_MAX_COUNT,
  GRASS_INNER_RADIUS,
  GRASS_HEIGHT,
  GRASS_WIDTH,
  GRASS_SIZE_JITTER,
  GRASS_SEED,
  GRASS_CHUNKS,
} from '@/three/constants/grassField'

/** Générateur pseudo-aléatoire déterministe (mulberry32) — semis reproductible. */
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Matrices des touffes d'herbe pour un RAYON donné, GROUPÉES PAR SECTEUR
 * angulaire (GRASS_CHUNKS parts de camembert) : chaque secteur devient un
 * InstancedMesh frustum-cullable — on ne dessine que ce que la caméra regarde.
 * Semis identique à avant (même graine, même densité, même plafond) : le rendu
 * ne change pas, seul le découpage change. Chaque touffe est posée au ras du
 * relief, tournée et redimensionnée aléatoirement.
 */
export function useGrassInstances(radius: number): THREE.Matrix4[][] {
  return useMemo(() => {
    // Nombre d'instances par la surface couverte × densité, plafonné.
    const area = Math.PI * (radius * radius - GRASS_INNER_RADIUS * GRASS_INNER_RADIUS)
    const count = Math.min(GRASS_MAX_COUNT, Math.floor(area * GRASS_DENSITY))

    const rng = makeRng(GRASS_SEED)
    const chunks: THREE.Matrix4[][] = Array.from({ length: GRASS_CHUNKS }, () => [])
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    const sectorSize = (Math.PI * 2) / GRASS_CHUNKS

    for (let i = 0; i < count; i++) {
      // Semis UNIFORME sur le disque (r ∝ √u pour une densité surfacique égale).
      const r = Math.sqrt(rng()) * radius
      if (r < GRASS_INNER_RADIUS) continue
      const angle = rng() * Math.PI * 2
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r

      const y = sampleLawnRelief(x, z)

      position.set(x, y, z)
      quaternion.setFromAxisAngle(up, rng() * Math.PI * 2) // orientation libre
      const jitter = 1 + (rng() - 0.5) * 2 * GRASS_SIZE_JITTER
      scale.set(GRASS_WIDTH * jitter, GRASS_HEIGHT * jitter, GRASS_WIDTH * jitter)

      // Secteur angulaire de la touffe → son chunk frustum-cullable.
      const sector = Math.min(GRASS_CHUNKS - 1, Math.floor(angle / sectorSize))
      chunks[sector].push(new THREE.Matrix4().compose(position, quaternion, scale))
    }
    return chunks
  }, [radius])
}
