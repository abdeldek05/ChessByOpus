import { useMemo } from 'react'
import * as THREE from 'three'
import { makeRng } from '@/lib/makeRng'
import { sampleTerrainHeight } from '@/lib/sampleTerrainHeight'
import { CACTUS, OASIS } from '@/three/constants/desertField'

/**
 * Matrices des cactus du désert : semis aléatoire DÉTERMINISTE sur le disque de
 * terrain, hors de la dalle béton (carré d'exclusion) et hors de l'oasis, chaque
 * cactus posé au ras des dunes, tourné et redimensionné aléatoirement. Même
 * patron que les rochers/l'herbe — calculé une fois par rayon.
 */
export function useCactusInstances(radius: number): THREE.Matrix4[] {
  return useMemo(() => {
    const rng = makeRng(CACTUS.seed)
    const matrices: THREE.Matrix4[] = []
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)

    const maxRadius = radius * CACTUS.edgeFrac
    let attempts = 0
    while (matrices.length < CACTUS.count && attempts < CACTUS.count * 8) {
      attempts += 1
      const r = CACTUS.minRadius + Math.sqrt(rng()) * Math.max(1, maxRadius - CACTUS.minRadius)
      const angle = rng() * Math.PI * 2
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r

      // Exclusions : dalle béton (carré) et oasis (disque).
      if (Math.max(Math.abs(x), Math.abs(z)) < CACTUS.padExclusion) continue
      if (Math.hypot(x - OASIS.x, z - OASIS.z) < OASIS.exclusionRadius) continue

      position.set(x, sampleTerrainHeight(x, z, 'desert'), z)
      quaternion.setFromAxisAngle(up, rng() * Math.PI * 2)
      const s = CACTUS.scaleMin + rng() * (CACTUS.scaleMax - CACTUS.scaleMin)
      scale.set(s, s, s)
      matrices.push(new THREE.Matrix4().compose(position, quaternion, scale))
    }
    return matrices
  }, [radius])
}
