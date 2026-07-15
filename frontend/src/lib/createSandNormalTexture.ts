import * as THREE from 'three'
import { SAND } from '@/three/constants/desertField'

// Force du relief des ripples dans la normal map (plus haut = plus creusé).
const RIPPLE_STRENGTH = 2.2
// Fréquence des ondulations (rides parallèles, serpentantes) et du grain.
const RIPPLE_FREQ = 0.22
const RIPPLE_WANDER = 0.045

/**
 * NORMAL MAP procédurale des rides de sable (ripples éoliens) : un champ de
 * hauteur de vaguelettes parallèles serpentantes + grain granulaire, converti
 * en normales par différences finies. Sous le soleil rasant golden hour, ces
 * micro-reliefs accrochent la lumière comme du vrai sable — sans géométrie
 * supplémentaire. Fonction pure, texture répétable.
 */
export function createSandNormalTexture(): THREE.CanvasTexture {
  const S = SAND.textureSize
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!

  // 1. Champ de hauteur : rides quasi horizontales qui serpentent + grain.
  const height = new Float32Array(S * S)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // Rides principales : sinus le long de Y, dérive de phase le long de X.
      const wander = Math.sin(x * RIPPLE_WANDER) * 9 + Math.sin(x * 0.013) * 4
      const ripple = Math.sin((y + wander) * RIPPLE_FREQ)
      // Profil asymétrique doux (face au vent douce, sous le vent plus raide).
      const shaped = Math.sign(ripple) * Math.pow(Math.abs(ripple), 0.8)
      // Grain granulaire fin (déterministe par pixel).
      const grain = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
      height[y * S + x] = shaped * 0.85 + grain * 0.3
    }
  }

  // 2. Hauteur → normales (différences finies, bords répétables via modulo).
  const image = ctx.createImageData(S, S)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const hL = height[y * S + ((x - 1 + S) % S)]
      const hR = height[y * S + ((x + 1) % S)]
      const hD = height[((y - 1 + S) % S) * S + x]
      const hU = height[((y + 1) % S) * S + x]
      const nx = (hL - hR) * RIPPLE_STRENGTH
      const ny = (hD - hU) * RIPPLE_STRENGTH
      const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1)
      const idx = (y * S + x) * 4
      image.data[idx] = Math.round((nx * inv * 0.5 + 0.5) * 255)
      image.data[idx + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255)
      image.data[idx + 2] = Math.round((inv * 0.5 + 0.5) * 255)
      image.data[idx + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.needsUpdate = true
  return texture
}
