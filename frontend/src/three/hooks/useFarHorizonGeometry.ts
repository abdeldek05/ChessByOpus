import { useMemo } from 'react'
import * as THREE from 'three'
import {
  HORIZON_RING_RADIUS,
  HORIZON_RING_THICKNESS,
  HORIZON_HILL_HEIGHT,
  HORIZON_SEGMENTS,
  HORIZON_HILL_FREQUENCY,
} from '@/three/constants/farHorizon'

/** Hauteur déterministe d'une colline à l'angle `theta` — silhouette non
 *  répétitive : somme de TROIS fréquences décalées (grandes masses + crêtes
 *  moyennes + dentelure fine), jamais deux profils identiques, effet chaîne de
 *  montagnes plutôt que houle régulière. */
function hillHeight(theta: number): number {
  const a = Math.sin(theta * HORIZON_HILL_FREQUENCY) * 0.5
  const b = Math.sin(theta * HORIZON_HILL_FREQUENCY * 2.3 + 1.7) * 0.32
  const c = Math.sin(theta * HORIZON_HILL_FREQUENCY * 4.7 + 0.6) * 0.18
  return Math.max(0, (a + b + c) * 0.5 + 0.5) * HORIZON_HILL_HEIGHT
}

/**
 * Géométrie d'un anneau de collines silhouette (voir FarHorizon.tsx) : une
 * bande basse-def, crête ondulée vers le haut, base plate au niveau du sol
 * lointain — jamais vue de près, sert uniquement à casser la ligne d'horizon
 * plate du sol lointain (FAR_GROUND_RADIUS). Mémoïsée une fois, coût nul en
 * régime permanent (silhouette statique, pas de relief réel dessous).
 */
export function useFarHorizonGeometry(): THREE.BufferGeometry {
  return useMemo(() => {
    const innerR = HORIZON_RING_RADIUS
    const outerR = HORIZON_RING_RADIUS + HORIZON_RING_THICKNESS
    const positions: number[] = []
    const indices: number[] = []

    for (let i = 0; i <= HORIZON_SEGMENTS; i++) {
      const theta = (i / HORIZON_SEGMENTS) * Math.PI * 2
      const cos = Math.cos(theta)
      const sin = Math.sin(theta)
      const h = hillHeight(theta)

      // Base (intérieure, au niveau du sol) → crête (extérieure, en hauteur).
      positions.push(innerR * cos, 0, innerR * sin)
      positions.push(outerR * cos, h, outerR * sin)

      if (i < HORIZON_SEGMENTS) {
        const a = i * 2
        const b = a + 1
        const c = a + 2
        const d = a + 3
        indices.push(a, b, c, b, d, c)
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }, [])
}
