import * as THREE from 'three'
import { createValueNoise2D } from '@/lib/valueNoise'

// Macro-variation du sol : une SEULE grande texture (non répétée) étalée sur
// tout le sol, qui décrit à quel point chaque ZONE est sèche/terreuse. Elle
// module la couleur de l'herbe tuilée à GRANDE échelle (des plaques de dizaines
// d'unités), pour casser l'uniformité que le tuilage seul ne peut pas éviter.
//
// Canal ROUGE seul = facteur de sécheresse ∈ [0,1] :
//   0   → herbe verte pleine
//   ~.5 → herbe jaunie / rase
//   1   → terre sèche / sol nu
const MACRO_SIZE = 256
const MACRO_SEED = 74113
const MACRO_GRID = 8 // grandes plages : peu de cellules sur toute la texture

/**
 * Texture de macro-sécheresse du sol (canvas, canal rouge = facteur sec/terre).
 * fBm sur une grille grossière → grandes zones organiques, quelques-unes bien
 * sèches, réparties naturellement. Non répétée (étalée 1× sur tout le sol).
 */
export function createGroundMacroTexture(): THREE.CanvasTexture {
  const noise = createValueNoise2D(MACRO_SEED, MACRO_GRID)
  const detail = createValueNoise2D(MACRO_SEED + 53, MACRO_GRID * 3)

  const canvas = document.createElement('canvas')
  canvas.width = MACRO_SIZE
  canvas.height = MACRO_SIZE
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(MACRO_SIZE, MACRO_SIZE)

  for (let y = 0; y < MACRO_SIZE; y++) {
    for (let x = 0; x < MACRO_SIZE; x++) {
      const u = (x / MACRO_SIZE) * MACRO_GRID
      const v = (y / MACRO_SIZE) * MACRO_GRID
      // Grandes plages (base) + variation moyenne (bords irréguliers).
      const base = noise.fbm(u, v, 3)
      const fine = detail.fbm(u * 2, v * 2, 3)
      let dryness = base * 0.75 + fine * 0.25
      // Contraste : prairie LUXURIANTE — l'essentiel du sol reste vert, seules
      // de rares poches franchement sèches percent (seuil relevé : moins de
      // zones sèches qu'avant, pour un aspect plus entretenu/fourni).
      dryness = THREE.MathUtils.clamp((dryness - 0.58) * 2.4, 0, 1)

      const p = (y * MACRO_SIZE + x) * 4
      const r = Math.round(dryness * 255)
      img.data[p] = r
      img.data[p + 1] = r
      img.data[p + 2] = r
      img.data[p + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.colorSpace = THREE.NoColorSpace
  return tex
}
