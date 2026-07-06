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

export interface LawnTextures {
  colorMap: THREE.CanvasTexture
  roughnessMap: THREE.CanvasTexture
}

function applyRepeat(tex: THREE.CanvasTexture, repeat: number): void {
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, repeat)
  tex.anisotropy = 16
}

// Couche de sol : fond sombre + micro-mouchetures de terre
function paintSoil(ctx: CanvasRenderingContext2D, rand: () => number): void {
  const S = LAWN_TEXTURE_SIZE
  ctx.fillStyle = LAWN.soilBase
  ctx.fillRect(0, 0, S, S)

  for (let i = 0; i < 4000; i++) {
    const x = rand() * S
    const y = rand() * S
    const r = 0.8 + rand() * 2.5
    ctx.globalAlpha = 0.08 + rand() * 0.18
    ctx.fillStyle = rand() > 0.55 ? '#0c1a06' : '#2e2008'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

// Grandes zones de couleur : densité, zones sèches, variations naturelles
function paintColorPatches(ctx: CanvasRenderingContext2D, rand: () => number): void {
  const S = LAWN_TEXTURE_SIZE
  for (let i = 0; i < LAWN_PATCH_COUNT; i++) {
    const x = rand() * S
    const y = rand() * S
    const radius = 50 + rand() * 160
    const isDry = rand() < 0.15
    const color = isDry
      ? LAWN.patchDry
      : i % 3 === 0
        ? LAWN.patchDark
        : LAWN.patchLight

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const cx = x + ox * S
        const cy = y + oy * S
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        g.addColorStop(0, color)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
      }
    }
  }
}

// Brins d'herbe réalistes : courbe de Bézier, dégradé base→pointe, épaisseur conique
function paintBlades(ctx: CanvasRenderingContext2D, rand: () => number): void {
  const S = LAWN_TEXTURE_SIZE
  const blades = LAWN.blades
  const windLean = 0.12  // dérive globale du vent (légère)

  for (let i = 0; i < LAWN_BLADE_COUNT; i++) {
    const x = rand() * S
    const y = rand() * S
    const length = 8 + rand() * 18
    const lean = windLean + (rand() - 0.5) * 0.5
    const baseWidth = 0.8 + rand() * 1.6

    // Point de contrôle Bézier : courbure naturelle vers la pointe
    const cpX = x + lean * length * 0.4 + (rand() - 0.5) * 3
    const cpY = y - length * (0.5 + rand() * 0.2)
    const tipX = x + lean * length
    const tipY = y - length

    const baseColor = blades[Math.floor(rand() * blades.length)]

    const g = ctx.createLinearGradient(x, y, tipX, tipY)
    g.addColorStop(0, baseColor)
    g.addColorStop(0.55, baseColor)
    g.addColorStop(1, LAWN.bladeTip)

    ctx.globalAlpha = 0.55 + rand() * 0.45
    ctx.strokeStyle = g
    ctx.lineWidth = baseWidth
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(cpX, cpY, tipX, tipY)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// Éclats lumineux sur les pointes (rosée / soleil rasant)
function paintSpecularTips(ctx: CanvasRenderingContext2D, rand: () => number): void {
  const S = LAWN_TEXTURE_SIZE
  ctx.globalCompositeOperation = 'screen'
  for (let i = 0; i < 1200; i++) {
    const x = rand() * S
    const y = rand() * S
    const r = 0.4 + rand() * 1.2
    ctx.globalAlpha = 0.04 + rand() * 0.1
    ctx.fillStyle = '#c8e888'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
}

// Roughness map : herbe très rugueuse (~0.9), légère variation
function buildRoughnessCanvas(rand: () => number): HTMLCanvasElement {
  const S = LAWN_TEXTURE_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#e0e0e0'
  ctx.fillRect(0, 0, S, S)

  for (let i = 0; i < 2500; i++) {
    const x = rand() * S
    const y = rand() * S
    const r = 6 + rand() * 28
    const v = Math.floor(155 + rand() * 85)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(${v},${v},${v},0.25)`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  return canvas
}

export function useLawnTexture(repeat: number): LawnTextures {
  return useMemo(() => {
    const colorCanvas = document.createElement('canvas')
    colorCanvas.width = LAWN_TEXTURE_SIZE
    colorCanvas.height = LAWN_TEXTURE_SIZE
    const ctx = colorCanvas.getContext('2d')!

    const rand = createSeededRandom(LAWN_TEXTURE_SEED)
    paintSoil(ctx, rand)
    paintColorPatches(ctx, rand)
    paintBlades(ctx, rand)
    paintSpecularTips(ctx, rand)

    const colorMap = new THREE.CanvasTexture(colorCanvas)
    colorMap.colorSpace = THREE.SRGBColorSpace
    applyRepeat(colorMap, repeat)

    const roughRand = createSeededRandom(LAWN_TEXTURE_SEED + 77)
    const roughnessMap = new THREE.CanvasTexture(buildRoughnessCanvas(roughRand))
    applyRepeat(roughnessMap, repeat)

    return { colorMap, roughnessMap }
  }, [repeat])
}
