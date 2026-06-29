import * as THREE from 'three'

interface CarbonFiberTextureOptions {
  size?: number
  cellSize?: number
  repeat?: number
}

const DARK_WEFT = '#0b0c0e'
const DARK_WARP = '#17191c'
const SHEEN = 'rgba(255, 255, 255, 0.06)'

/**
 * Génère un tissage carbone 2x2 (twill) procédural, sans dépendre d'un bake
 * Blender : une grille de cases sombres alternées en diagonale, avec un
 * léger trait de brillance par case pour évoquer le fil tissé.
 */
export function createCarbonFiberTexture({
  size = 128,
  cellSize = 16,
  repeat = 28,
}: CarbonFiberTextureOptions = {}): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  const cellCount = Math.ceil(size / cellSize)
  for (let cellY = 0; cellY < cellCount; cellY++) {
    for (let cellX = 0; cellX < cellCount; cellX++) {
      const diagonal = (cellX + cellY) % 4
      const x = cellX * cellSize
      const y = cellY * cellSize

      ctx.fillStyle = diagonal < 2 ? DARK_WEFT : DARK_WARP
      ctx.fillRect(x, y, cellSize, cellSize)

      ctx.strokeStyle = SHEEN
      ctx.lineWidth = 1
      ctx.beginPath()
      if (diagonal < 2) {
        ctx.moveTo(x, y + cellSize)
        ctx.lineTo(x + cellSize, y)
      } else {
        ctx.moveTo(x, y)
        ctx.lineTo(x + cellSize, y + cellSize)
      }
      ctx.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
