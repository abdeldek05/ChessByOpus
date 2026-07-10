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
 * Matrices de transformation des touffes d'herbe, calculées une fois pour un
 * RAYON donné (= tout le terrain visible). Le nombre d'instances suit la surface
 * (densité constante), plafonné pour les perfs. Semis UNIFORME sur le disque
 * (herbe partout, pas juste au centre), chaque touffe posée au ras du relief,
 * tournée et redimensionnée aléatoirement. L'étang est laissé libre.
 */
export function useGrassInstances(radius: number): THREE.Matrix4[] {
  return useMemo(() => {
    // Nombre d'instances par la surface couverte × densité, plafonné.
    const area = Math.PI * (radius * radius - GRASS_INNER_RADIUS * GRASS_INNER_RADIUS)
    const count = Math.min(GRASS_MAX_COUNT, Math.floor(area * GRASS_DENSITY))

    const rng = makeRng(GRASS_SEED)
    const matrices: THREE.Matrix4[] = []
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)

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

      matrices.push(new THREE.Matrix4().compose(position, quaternion, scale))
    }
    return matrices
  }, [radius])
}
