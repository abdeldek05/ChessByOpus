import { useMemo } from 'react'
import * as THREE from 'three'

const TILE = 512
const REPEAT = 240

/**
 * Texture de sol procédurale (grain fin + taches basse fréquence) générée une
 * fois en canvas — donne du relief/matière au terrain sans charger d'image ni
 * coûter en continu. Multipliée par la teinte d'ambiance au rendu.
 */
export function useGroundTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = TILE
    canvas.height = TILE
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // Base claire (la couleur réelle vient du color du matériau).
      ctx.fillStyle = '#cccccc'
      ctx.fillRect(0, 0, TILE, TILE)

      // Taches douces basse fréquence pour éviter un sol uniforme.
      for (let i = 0; i < 40; i += 1) {
        const radius = 40 + Math.random() * 120
        const x = Math.random() * TILE
        const y = Math.random() * TILE
        const shade = 150 + Math.floor(Math.random() * 90)
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        gradient.addColorStop(0, `rgba(${shade},${shade},${shade},0.28)`)
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = gradient
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
      }

      // Grain fin.
      const grain = ctx.getImageData(0, 0, TILE, TILE)
      for (let i = 0; i < grain.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 32
        grain.data[i] += n
        grain.data[i + 1] += n
        grain.data[i + 2] += n
      }
      ctx.putImageData(grain, 0, 0)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(REPEAT, REPEAT)
    texture.anisotropy = 8
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}
