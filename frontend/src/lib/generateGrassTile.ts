import * as THREE from 'three'
import { sampleGroundHeight } from '@/lib/sampleGroundHeight'
import {
  GRASS_TILE_SIZE,
  GRASS_DENSITY,
  GRASS_MAX_PER_TILE,
  GRASS_INNER_RADIUS,
  GRASS_LOW_DENSITY_RADIUS,
  GRASS_LOW_DENSITY_FACTOR,
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
 * La hauteur vient de `sampleGroundHeight` (source de vérité unique du relief).
 */
export function generateGrassTile(tileX: number, tileZ: number): THREE.Matrix4[] {
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
    const distance = Math.hypot(x, z)
    if (distance < GRASS_INNER_RADIUS) continue
    // Zone tampon juste après le pad : on garde une fraction des touffes
    // seulement (raccord progressif plutôt qu'un passage net à pleine densité).
    if (distance < GRASS_LOW_DENSITY_RADIUS && rng() > GRASS_LOW_DENSITY_FACTOR) continue

    const y = sampleGroundHeight(x, z)

    position.set(x, y, z)
    quaternion.setFromAxisAngle(up, rng() * Math.PI * 2)
    const jitter = 1 + (rng() - 0.5) * 2 * GRASS_SIZE_JITTER
    scale.set(GRASS_WIDTH * jitter, GRASS_HEIGHT * jitter, GRASS_WIDTH * jitter)

    matrices.push(new THREE.Matrix4().compose(position, quaternion, scale))
  }

  return matrices
}
