import * as THREE from 'three'
import { createValueNoise2D } from '@/lib/valueNoise'

// Texture de bruit organique pour la brume d'horizon (voir HorizonHaze) :
// fBm sur grille TORIQUE (répétable sans couture, cf. createValueNoise2D) —
// tuilée horizontalement sur la coque cylindrique et dérivée lentement en U
// (voir useHorizonHazeMaterial) pour une ondulation qui ne « tourne » jamais
// de façon visible. Canal rouge seul = densité de vapeur ∈ [0,1].
const NOISE_SIZE = 512
const NOISE_SEED = 20260723
const NOISE_GRID = 10

export function createHazeNoiseTexture(): THREE.CanvasTexture {
  const base = createValueNoise2D(NOISE_SEED, NOISE_GRID)
  const detail = createValueNoise2D(NOISE_SEED + 17, NOISE_GRID * 3)

  const canvas = document.createElement('canvas')
  canvas.width = NOISE_SIZE
  canvas.height = NOISE_SIZE
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(NOISE_SIZE, NOISE_SIZE)

  for (let y = 0; y < NOISE_SIZE; y++) {
    for (let x = 0; x < NOISE_SIZE; x++) {
      const u = (x / NOISE_SIZE) * NOISE_GRID
      const v = (y / NOISE_SIZE) * NOISE_GRID
      const coarse = base.fbm(u, v, 4)
      const fine = detail.fbm(u * 1.7, v * 1.7, 3)
      const value = THREE.MathUtils.clamp(coarse * 0.7 + fine * 0.3, 0, 1)

      const p = (y * NOISE_SIZE + x) * 4
      const r = Math.round(value * 255)
      img.data[p] = r
      img.data[p + 1] = r
      img.data[p + 2] = r
      img.data[p + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.NoColorSpace
  return tex
}
