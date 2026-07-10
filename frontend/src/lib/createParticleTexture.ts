import * as THREE from 'three'

/**
 * Génère une texture de particule DOUCE (disque à dégradé radial, opaque au
 * centre, transparent au bord) via un canvas — aucun asset externe. Sert de
 * sprite pour la flamme et la fumée : superposées et additionnées, elles donnent
 * un volume continu (pas de contours « dessinés »). `softness` règle la
 * progressivité du fondu vers le bord (0 = net, 1 = très diffus).
 */
export function createParticleTexture(softness = 0.5): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const half = size / 2
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
  // Centre plein, fondu doux vers le bord selon `softness`.
  const mid = 0.2 + softness * 0.5
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(mid, 'rgba(255,255,255,0.75)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}
