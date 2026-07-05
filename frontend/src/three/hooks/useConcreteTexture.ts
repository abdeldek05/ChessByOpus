import { useMemo } from 'react'
import * as THREE from 'three'
import { createSeededRandom } from '@/lib/createSeededRandom'

const SIZE = 512
const GRAIN_COUNT = 9000
const STAIN_COUNT = 12
const STREAK_COUNT = 8

/**
 * Texture béton procédurale : fond gris, grain granuleux, taches d'usure et
 * coulures verticales discrètes. La teinte finale est modulée par la couleur
 * du matériau de chaque mesh (blocs, dalle).
 */
export function useConcreteTexture(seed: number): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D indisponible pour la texture béton')

    const rand = createSeededRandom(seed)
    ctx.fillStyle = '#b4b6b2'
    ctx.fillRect(0, 0, SIZE, SIZE)

    for (let i = 0; i < GRAIN_COUNT; i++) {
      const shade = rand() < 0.5 ? '30, 32, 30' : '235, 236, 233'
      ctx.fillStyle = `rgba(${shade}, ${0.05 + rand() * 0.14})`
      ctx.fillRect(rand() * SIZE, rand() * SIZE, 1 + rand() * 2, 1 + rand() * 2)
    }

    for (let i = 0; i < STAIN_COUNT; i++) {
      const x = rand() * SIZE
      const y = rand() * SIZE
      const radius = 30 + rand() * 80
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, 'rgba(72, 74, 70, 0.1)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }

    for (let i = 0; i < STREAK_COUNT; i++) {
      const x = rand() * SIZE
      ctx.fillStyle = `rgba(88, 90, 86, ${0.04 + rand() * 0.05})`
      ctx.fillRect(x, rand() * SIZE * 0.4, 2 + rand() * 5, SIZE * (0.3 + rand() * 0.5))
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    return texture
  }, [seed])
}
