import { useMemo } from 'react'
import * as THREE from 'three'
import { createSeededRandom } from '@/lib/createSeededRandom'
import {
  LAWN,
  LAWN_TEXTURE_SIZE,
  LAWN_BLADE_COUNT,
  LAWN_PATCH_COUNT,
  LAWN_TEXTURE_SEED,
} from '@/three/constants/lawnField'

function paintPatches(ctx: CanvasRenderingContext2D, rand: () => number): void {
  // Chaque tache est répétée en 3×3 autour de la tuile pour que la texture
  // reste raccordable une fois répétée sur toute la pelouse.
  for (let i = 0; i < LAWN_PATCH_COUNT; i++) {
    const x = rand() * LAWN_TEXTURE_SIZE
    const y = rand() * LAWN_TEXTURE_SIZE
    const radius = 60 + rand() * 150
    const color = i % 2 === 0 ? LAWN.patchDark : LAWN.patchLight
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const cx = x + ox * LAWN_TEXTURE_SIZE
        const cy = y + oy * LAWN_TEXTURE_SIZE
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
      }
    }
  }
}

function paintBlades(ctx: CanvasRenderingContext2D, rand: () => number): void {
  ctx.lineWidth = 1
  for (let i = 0; i < LAWN_BLADE_COUNT; i++) {
    const x = rand() * LAWN_TEXTURE_SIZE
    const y = rand() * LAWN_TEXTURE_SIZE
    const length = 2 + rand() * 4
    const angle = -Math.PI / 2 + (rand() - 0.5) * 1.2
    ctx.strokeStyle = LAWN.blades[i % LAWN.blades.length]
    ctx.globalAlpha = 0.25 + rand() * 0.5
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/**
 * Texture de pelouse procédurale : fond vert, larges taches de densité
 * raccordables et milliers de brins dessinés une seule fois sur un canvas.
 */
export function useLawnTexture(repeat: number): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = LAWN_TEXTURE_SIZE
    canvas.height = LAWN_TEXTURE_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D indisponible pour la texture de pelouse')

    const rand = createSeededRandom(LAWN_TEXTURE_SEED)
    ctx.fillStyle = LAWN.base
    ctx.fillRect(0, 0, LAWN_TEXTURE_SIZE, LAWN_TEXTURE_SIZE)
    paintPatches(ctx, rand)
    paintBlades(ctx, rand)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeat, repeat)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    return texture
  }, [repeat])
}
