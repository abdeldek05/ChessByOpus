import { useMemo } from 'react'
import * as THREE from 'three'
import { sampleGroundHeight } from '@/lib/sampleGroundHeight'

export interface ScatterParams {
  /** Nombre d'instances visé. */
  count: number
  /** Rayon intérieur d'exclusion (autour du pas de tir). */
  innerRadius: number
  /** Rayon de coupure : aucune instance au-delà (borne le coût triangles). */
  cutoffRadius: number
  /** Graine du PRNG (semis reproductible, distinct par type d'objet). */
  seed: number
  /** Échelle de base des instances. */
  baseScale: number
  /** Variation ± de l'échelle (0-1). */
  scaleJitter: number
  /** Enfoncement sous le sol (unités) pour ancrer roches/troncs. */
  sink?: number
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
 * Semis générique d'instances sur TOUTE la map : matrices posées au ras du
 * relief (sampleGroundHeight, source de vérité unique), réparties dans l'anneau
 * [innerRadius, outerRadius] avec une densité surfacique décroissante douce
 * (plus dense près du centre, plus rare au loin), échelle et rotation variées.
 * Réutilisable pour arbres, roches, buissons (étape 4 ajustera les profils).
 */
export function useScatterInstances(params: ScatterParams): THREE.Matrix4[] {
  const { count, innerRadius, cutoffRadius, seed, baseScale, scaleJitter, sink = 0 } = params
  return useMemo(() => {
    const rng = makeRng(seed)
    const matrices: THREE.Matrix4[] = []
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)

    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2
      // r ∝ √u donne une densité surfacique UNIFORME ; on biaise vers le centre
      // en élevant u à une puissance > 0.5 (densité décroissante avec la distance).
      const u = Math.pow(rng(), 1.6)
      const r = innerRadius + u * (cutoffRadius - innerRadius)
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = sampleGroundHeight(x, z) - sink

      const s = baseScale * (1 + (rng() - 0.5) * 2 * scaleJitter)
      pos.set(x, y, z)
      quat.setFromAxisAngle(up, rng() * Math.PI * 2)
      scale.set(s, s, s)
      matrices.push(new THREE.Matrix4().compose(pos, quat, scale))
    }
    return matrices
  }, [count, innerRadius, cutoffRadius, seed, baseScale, scaleJitter, sink])
}
