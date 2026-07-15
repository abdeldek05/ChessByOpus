import * as THREE from 'three'
import { sampleTerrainHeight } from '@/lib/sampleTerrainHeight'
import {
  GRASS_TILE_SIZE,
  GRASS_DENSITY,
  GRASS_MAX_PER_TILE,
  GRASS_INNER_RADIUS,
  GRASS_HEIGHT,
  GRASS_WIDTH,
  GRASS_SIZE_JITTER,
  GRASS_SEED,
} from '@/three/constants/grassField'

/** PRNG déterministe (mulberry32) — même seed+coords = même herbe, toujours. */
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Combine la seed globale et les coordonnées entières de la tuile en une seed
// unique par tuile (mélange simple type hash) — chaque tuile a un semis
// distinct mais stable (aucun scintillement en la remontant plus tard).
function tileSeed(tileX: number, tileZ: number): number {
  let h = GRASS_SEED
  h = Math.imul(h ^ tileX, 0x9e3779b1)
  h = Math.imul(h ^ tileZ, 0x85ebca6b)
  h ^= h >>> 13
  return h >>> 0
}

/**
 * Semis d'herbe d'UNE TUILE (fonction pure, déterministe par ses coordonnées
 * entières) : densité UNIFORME, identique pour toutes les tuiles — c'est le
 * streaming (useGrassTiles) qui borne le coût total, pas une densité variable.
 * Les touffes trop proches de l'origine (dalle du pas de tir) sont exclues.
 */
export function generateGrassTile(tileX: number, tileZ: number, biome: 'meadow' | 'desert' = 'meadow'): THREE.Matrix4[] {
  const rng = makeRng(tileSeed(tileX, tileZ))
  const originX = tileX * GRASS_TILE_SIZE
  const originZ = tileZ * GRASS_TILE_SIZE

  const area = GRASS_TILE_SIZE * GRASS_TILE_SIZE
  const count = Math.min(GRASS_MAX_PER_TILE, Math.floor(area * GRASS_DENSITY))

  const matrices: THREE.Matrix4[] = []
  const position = new THREE.Vector3()
  const quaternion = new THREE.Quaternion()
  const scale = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)

  for (let i = 0; i < count; i++) {
    const x = originX + rng() * GRASS_TILE_SIZE
    const z = originZ + rng() * GRASS_TILE_SIZE
    if (Math.hypot(x, z) < GRASS_INNER_RADIUS) continue

    const y = sampleTerrainHeight(x, z, biome)

    position.set(x, y, z)
    quaternion.setFromAxisAngle(up, rng() * Math.PI * 2)
    const jitter = 1 + (rng() - 0.5) * 2 * GRASS_SIZE_JITTER
    scale.set(GRASS_WIDTH * jitter, GRASS_HEIGHT * jitter, GRASS_WIDTH * jitter)

    matrices.push(new THREE.Matrix4().compose(position, quaternion, scale))
  }

  return matrices
}
