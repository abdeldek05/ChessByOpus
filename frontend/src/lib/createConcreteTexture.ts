import * as THREE from 'three'
import { createValueNoise2D } from '@/lib/valueNoise'

export interface ConcreteTextures {
  colorMap: THREE.CanvasTexture
  normalMap: THREE.CanvasTexture
}

/**
 * Pack de textures béton PROCÉDURAL (canvas, pas d'image) : dalle grise avec
 * mottling (taches d'usure/humidité) via fBm, joints de dilatation en grille, et
 * une normal map dérivée d'un micro-relief. Se répète sans couture. Fonction
 * pure — réutilisée sur la plateforme et les voies de la zone de lancement.
 *
 * @param size   résolution de la texture
 * @param joints nombre de cases de joints de dilatation par tuile (0 = aucun)
 */
export function createConcreteTexture(size = 512, joints = 4): ConcreteTextures {
  const noise = createValueNoise2D(4242, 12)
  const detail = createValueNoise2D(99, 40)

  // --- Albédo ---
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = size
  colorCanvas.height = size
  const ctx = colorCanvas.getContext('2d')!
  const img = ctx.createImageData(size, size)

  const height = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * 12
      const v = (y / size) * 12
      // Béton : gris moyen modulé par du bruit doux + grain fin.
      const shade = noise.fbm(u, v, 4) * 0.6 + detail.fbm(u * 3, v * 3, 3) * 0.4
      let g = 118 + (shade - 0.5) * 70 // ~gris béton
      // Joints de dilatation : lignes sombres régulières.
      if (joints > 0) {
        const jx = (x / size) * joints
        const jy = (y / size) * joints
        const nearJoint = Math.min(jx - Math.floor(jx), jy - Math.floor(jy))
        if (nearJoint < 0.02) g -= 45
      }
      const c = Math.max(60, Math.min(190, g))
      height[y * size + x] = shade
      const p = (y * size + x) * 4
      img.data[p] = c
      img.data[p + 1] = c
      img.data[p + 2] = c * 0.98 // très léger chaud
      img.data[p + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  // --- Normal map (Sobel sur le micro-relief) ---
  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = size
  normalCanvas.height = size
  const nctx = normalCanvas.getContext('2d')!
  const nimg = nctx.createImageData(size, size)
  const wrap = (i: number) => ((i % size) + size) % size
  const strength = 1.4
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hl = height[y * size + wrap(x - 1)]
      const hr = height[y * size + wrap(x + 1)]
      const hu = height[wrap(y - 1) * size + x]
      const hd = height[wrap(y + 1) * size + x]
      const nx = (hl - hr) * strength
      const ny = (hu - hd) * strength
      const nz = 1
      const len = Math.hypot(nx, ny, nz)
      const p = (y * size + x) * 4
      nimg.data[p] = ((nx / len) * 0.5 + 0.5) * 255
      nimg.data[p + 1] = ((ny / len) * 0.5 + 0.5) * 255
      nimg.data[p + 2] = ((nz / len) * 0.5 + 0.5) * 255
      nimg.data[p + 3] = 255
    }
  }
  nctx.putImageData(nimg, 0, 0)

  const colorMap = new THREE.CanvasTexture(colorCanvas)
  colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping
  colorMap.colorSpace = THREE.SRGBColorSpace
  const normalMap = new THREE.CanvasTexture(normalCanvas)
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping

  return { colorMap, normalMap }
}
