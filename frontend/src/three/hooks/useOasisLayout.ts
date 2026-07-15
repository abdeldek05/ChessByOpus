import { useMemo } from 'react'
import * as THREE from 'three'
import { makeRng } from '@/lib/makeRng'
import { sampleTerrainHeight } from '@/lib/sampleTerrainHeight'
import { OASIS } from '@/three/constants/desertField'

export interface PalmPlacement {
  position: [number, number, number]
  rotationY: number
  scale: number
  lean: number
}

interface OasisLayout {
  /** Hauteur de la surface (au-dessus de la dune la plus haute sous l'eau). */
  groundY: number
  palms: PalmPlacement[]
  /** Matrices des touffes de roseaux au bord de l'eau. */
  reedMatrices: THREE.Matrix4[]
}

/**
 * Implantation de l'OASIS calculée une fois (déterministe) : hauteur de la
 * surface de l'eau (jamais crevée par une dune), couronne de palmiers-dattiers
 * et anneau de roseaux serrés au bord de l'eau — tous posés au ras des dunes.
 */
export function useOasisLayout(): OasisLayout {
  return useMemo(() => {
    // Dune la plus haute sous l'emprise de l'eau → hauteur de la surface.
    let highest = -Infinity
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      for (const frac of [0, 0.5, 1]) {
        const x = OASIS.x + Math.cos(angle) * OASIS.waterRadius * frac
        const z = OASIS.z + Math.sin(angle) * OASIS.waterRadius * frac
        highest = Math.max(highest, sampleTerrainHeight(x, z, 'desert'))
      }
    }

    const rng = makeRng(OASIS.seed)

    // Couronne de palmiers : angles répartis + variations déterministes.
    const palms: PalmPlacement[] = Array.from({ length: OASIS.palmCount }, (_, i) => {
      const angle = (i / OASIS.palmCount) * Math.PI * 2 + rng() * 0.5
      const radius = OASIS.palmRadius + rng() * 3
      const x = OASIS.x + Math.cos(angle) * radius
      const z = OASIS.z + Math.sin(angle) * radius
      return {
        position: [x, sampleTerrainHeight(x, z, 'desert'), z] as [number, number, number],
        rotationY: rng() * Math.PI * 2,
        scale: 0.85 + rng() * 0.4,
        lean: (rng() - 0.5) * 0.24,
      }
    })

    // Roseaux : anneau serré entre le bord de l'eau et le sable mouillé.
    const reedMatrices: THREE.Matrix4[] = []
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    for (let i = 0; i < OASIS.reedCount; i++) {
      const angle = rng() * Math.PI * 2
      const radius = OASIS.reedInner + rng() * (OASIS.reedOuter - OASIS.reedInner)
      const x = OASIS.x + Math.cos(angle) * radius
      const z = OASIS.z + Math.sin(angle) * radius
      position.set(x, Math.max(sampleTerrainHeight(x, z, 'desert'), highest), z)
      quaternion.setFromAxisAngle(up, rng() * Math.PI * 2)
      const jitter = 0.7 + rng() * 0.7
      scale.set(0.8 * jitter, OASIS.reedHeight * jitter, 0.8 * jitter)
      reedMatrices.push(new THREE.Matrix4().compose(position, quaternion, scale))
    }

    return { groundY: highest, palms, reedMatrices }
  }, [])
}
