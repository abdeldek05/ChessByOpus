import * as THREE from 'three'
import { createValueNoise2D } from '@/lib/valueNoise'

export interface NoiseNormalOptions {
  /** Graine du bruit (relief unique par surface). */
  seed: number
  /** Cellules de la grille de bruit torique (répétition sans couture). */
  grid: number
  /** Octaves du fBm (détail). */
  octaves: number
  /** Force du relief encodé (gradient → pente de la normale). */
  strength: number
  /** Résolution de la texture (défaut 512). */
  size?: number
}

/**
 * Normal map procédurale d'une surface de terrain : champ de hauteur fBm
 * TORIQUE (répétable sans couture) converti en normales tangentes par gradient
 * de Sobel — même méthode que le bloc normal de `createLawnTextures`, mais
 * paramétrée (roche cassée, terre en mottes…). Fonction pure.
 */
export function createNoiseNormalTexture(opts: NoiseNormalOptions): THREE.CanvasTexture {
  const S = opts.size ?? 512
  const noise = createValueNoise2D(opts.seed, opts.grid)

  // --- Champ de hauteur ---
  const height = new Float32Array(S * S)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = (x / S) * opts.grid
      const v = (y / S) * opts.grid
      height[y * S + x] = noise.fbm(u, v, opts.octaves)
    }
  }

  // --- Normales par gradient (wrap torique : la texture reste répétable) ---
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(S, S)
  const wrap = (i: number) => ((i % S) + S) % S
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const hl = height[y * S + wrap(x - 1)]
      const hr = height[y * S + wrap(x + 1)]
      const hu = height[wrap(y - 1) * S + x]
      const hd = height[wrap(y + 1) * S + x]
      const nx = (hl - hr) * opts.strength
      const ny = (hu - hd) * opts.strength
      const nz = 1
      const len = Math.hypot(nx, ny, nz)
      const p = (y * S + x) * 4
      img.data[p] = ((nx / len) * 0.5 + 0.5) * 255
      img.data[p + 1] = ((ny / len) * 0.5 + 0.5) * 255
      img.data[p + 2] = ((nz / len) * 0.5 + 0.5) * 255
      img.data[p + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}
