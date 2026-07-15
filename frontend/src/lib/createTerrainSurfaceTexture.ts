import * as THREE from 'three'
import { SURFACE_TEXTURE_SIZE, type SurfacePalette } from '@/three/constants/terrainSurfaces'

/**
 * Texture procédurale d'une SURFACE de terrain (terre, herbe, herbe sèche,
 * roche) à partir d'une palette : fond dominant, larges taches douces
 * clair/sombre (variations naturelles), mouchetis d'accent (cailloux/brins) et
 * grain fin. Même approche canvas → CanvasTexture répétable que
 * `createSandTexture` (aucune image externe). Fonction pure.
 */
export function createTerrainSurfaceTexture(palette: SurfacePalette): THREE.CanvasTexture {
  const S = SURFACE_TEXTURE_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!

  // Fond dominant.
  ctx.fillStyle = palette.base
  ctx.fillRect(0, 0, S, S)

  // Larges taches douces clair/sombre : casse l'uniformité de la surface.
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * S
    const y = Math.random() * S
    const r = S * (0.1 + Math.random() * 0.22)
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    const tint = Math.random() < 0.5 ? palette.light : palette.dark
    grad.addColorStop(0, `${tint}33`)
    grad.addColorStop(1, `${tint}00`)
    ctx.fillStyle = grad
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  // Mouchetis d'accent : petits amas irréguliers (cailloux, mottes, brins secs).
  const accentCount = Math.round(260 * palette.grain)
  for (let i = 0; i < accentCount; i++) {
    const x = Math.random() * S
    const y = Math.random() * S
    const r = 1 + Math.random() * 3
    ctx.fillStyle = `${palette.accent}${Math.random() < 0.5 ? '44' : '22'}`
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * (0.6 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  // Grain fin : poivrage clair/sombre pour la micro-texture.
  const grainCount = Math.round(3600 * palette.grain)
  for (let i = 0; i < grainCount; i++) {
    const light = Math.random() < 0.5
    ctx.fillStyle = light ? `${palette.light}22` : `${palette.dark}22`
    ctx.fillRect(Math.random() * S, Math.random() * S, 1, 1)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.needsUpdate = true
  return texture
}
