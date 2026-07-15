import * as THREE from 'three'
import { GRASS_COLORS, GRASS_TEXTURE_SIZE } from '@/three/constants/grassField'

/** Palette d'une touffe : base (pied), milieu et pointe des brins. */
export interface GrassPalette {
  base: string
  mid: string
  tip: string
}

/**
 * Texture procédurale d'une touffe d'herbe (canvas → CanvasTexture avec alpha) :
 * plusieurs brins verticaux montant en s'affinant, de la base sombre vers la
 * pointe. Fond transparent — appliquée sur des plans croisés, elle donne
 * l'illusion de vraies touffes sans charger d'image externe. La palette est
 * paramétrable : verte (prairie, défaut) ou paille (buissons secs du désert).
 * Fonction pure.
 */
export function createGrassTexture(palette: GrassPalette = GRASS_COLORS): THREE.CanvasTexture {
  const S = GRASS_TEXTURE_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, S, S)

  const blades = 14
  for (let i = 0; i < blades; i++) {
    const x = (S / blades) * (i + 0.5) + (Math.random() - 0.5) * (S / blades) * 0.8
    const baseW = S * 0.02 + Math.random() * S * 0.015
    const height = S * (0.55 + Math.random() * 0.4)
    const bend = (Math.random() - 0.5) * S * 0.25 // courbure latérale
    const topX = x + bend

    // Dégradé base→pointe le long du brin.
    const grad = ctx.createLinearGradient(x, S, topX, S - height)
    grad.addColorStop(0, palette.base)
    grad.addColorStop(0.5, palette.mid)
    grad.addColorStop(1, palette.tip)
    ctx.fillStyle = grad

    // Brin = triangle effilé (base large → pointe fine).
    ctx.beginPath()
    ctx.moveTo(x - baseW, S)
    ctx.lineTo(x + baseW, S)
    ctx.lineTo(topX, S - height)
    ctx.closePath()
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}
