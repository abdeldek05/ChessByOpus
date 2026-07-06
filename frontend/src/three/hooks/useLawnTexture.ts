import { useMemo } from 'react'
import * as THREE from 'three'
import { createValueNoise2D } from '@/lib/valueNoise'
import {
  LAWN,
  LAWN_TEXTURE_SIZE,
  LAWN_NOISE_GRID,
  LAWN_TEXTURE_SEED,
  LAWN_NORMAL_STRENGTH,
} from '@/three/constants/lawnField'

export interface LawnTextures {
  colorMap: THREE.CanvasTexture
  normalMap: THREE.CanvasTexture
  roughnessMap: THREE.CanvasTexture
}

function applyRepeat(tex: THREE.CanvasTexture, repeat: number, srgb: boolean): void {
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, repeat)
  tex.anisotropy = 8
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
}

interface Rgb {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  }
}

/**
 * Pack de texture terrain PROCÉDURAL et PROPRE (pas de brins peints) :
 * champ d'herbe généré par fBm — variations de couleur douces (albédo),
 * micro-relief (normal map dérivée du champ de hauteur), et rugosité.
 * Le tout se répète sans couture (bruit torique) sur tout le terrain.
 */
export function useLawnTexture(repeat: number): LawnTextures {
  return useMemo(() => {
    const S = LAWN_TEXTURE_SIZE
    const colorNoise = createValueNoise2D(LAWN_TEXTURE_SEED, LAWN_NOISE_GRID)
    const detailNoise = createValueNoise2D(LAWN_TEXTURE_SEED + 31, LAWN_NOISE_GRID * 3)
    const patchNoise = createValueNoise2D(LAWN_TEXTURE_SEED + 97, Math.max(4, Math.round(LAWN_NOISE_GRID / 3)))

    const dark = hexToRgb(LAWN.colorDark)
    const mid = hexToRgb(LAWN.colorMid)
    const light = hexToRgb(LAWN.colorLight)
    const dry = hexToRgb(LAWN.colorDry)

    // --- Champ de hauteur (pour normal + roughness) ---
    const height = new Float32Array(S * S)
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const u = (x / S) * LAWN_NOISE_GRID
        const v = (y / S) * LAWN_NOISE_GRID
        // Micro-relief : détail fin dominant + ondulation moyenne.
        const h = detailNoise.fbm(u * 3, v * 3, 4) * 0.7 + colorNoise.fbm(u, v, 3) * 0.3
        height[y * S + x] = h
      }
    }

    // --- Albédo ---
    const colorCanvas = document.createElement('canvas')
    colorCanvas.width = S
    colorCanvas.height = S
    const colorCtx = colorCanvas.getContext('2d')!
    const colorImg = colorCtx.createImageData(S, S)

    // --- Roughness ---
    const roughCanvas = document.createElement('canvas')
    roughCanvas.width = S
    roughCanvas.height = S
    const roughCtx = roughCanvas.getContext('2d')!
    const roughImg = roughCtx.createImageData(S, S)

    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const idx = y * S + x
        const u = (x / S) * LAWN_NOISE_GRID
        const v = (y / S) * LAWN_NOISE_GRID

        // Mottling de couleur : bruit doux pour zones claires/foncées.
        const shade = colorNoise.fbm(u, v, 4)
        const detail = detailNoise.fbm(u * 2, v * 2, 3)
        const patch = patchNoise.fbm(u, v, 2) // grandes zones sèches

        // Base : sombre → clair selon le mottling.
        let col = mix(dark, mid, THREE.MathUtils.clamp(shade * 1.3, 0, 1))
        col = mix(col, light, THREE.MathUtils.clamp((detail - 0.5) * 1.4, 0, 1))
        // Taches sèches jaunies là où le grand bruit est haut.
        col = mix(col, dry, THREE.MathUtils.clamp((patch - 0.62) * 2.2, 0, 1) * 0.6)

        const p = idx * 4
        colorImg.data[p] = col.r
        colorImg.data[p + 1] = col.g
        colorImg.data[p + 2] = col.b
        colorImg.data[p + 3] = 255

        // Rugosité : herbe très rugueuse, légèrement moins sur les zones denses.
        const rough = 230 - detail * 40
        roughImg.data[p] = rough
        roughImg.data[p + 1] = rough
        roughImg.data[p + 2] = rough
        roughImg.data[p + 3] = 255
      }
    }
    colorCtx.putImageData(colorImg, 0, 0)
    roughCtx.putImageData(roughImg, 0, 0)

    // --- Normal map (Sobel sur le champ de hauteur) ---
    const normalCanvas = document.createElement('canvas')
    normalCanvas.width = S
    normalCanvas.height = S
    const normalCtx = normalCanvas.getContext('2d')!
    const normalImg = normalCtx.createImageData(S, S)
    const wrap = (i: number) => ((i % S) + S) % S
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const hl = height[y * S + wrap(x - 1)]
        const hr = height[y * S + wrap(x + 1)]
        const hu = height[wrap(y - 1) * S + x]
        const hd = height[wrap(y + 1) * S + x]
        // Gradient → normale tangente.
        const nx = (hl - hr) * LAWN_NORMAL_STRENGTH
        const ny = (hu - hd) * LAWN_NORMAL_STRENGTH
        const nz = 1
        const len = Math.hypot(nx, ny, nz)
        const p = (y * S + x) * 4
        normalImg.data[p] = ((nx / len) * 0.5 + 0.5) * 255
        normalImg.data[p + 1] = ((ny / len) * 0.5 + 0.5) * 255
        normalImg.data[p + 2] = ((nz / len) * 0.5 + 0.5) * 255
        normalImg.data[p + 3] = 255
      }
    }
    normalCtx.putImageData(normalImg, 0, 0)

    const colorMap = new THREE.CanvasTexture(colorCanvas)
    applyRepeat(colorMap, repeat, true)
    const normalMap = new THREE.CanvasTexture(normalCanvas)
    applyRepeat(normalMap, repeat, false)
    const roughnessMap = new THREE.CanvasTexture(roughCanvas)
    applyRepeat(roughnessMap, repeat, false)

    return { colorMap, normalMap, roughnessMap }
  }, [repeat])
}
