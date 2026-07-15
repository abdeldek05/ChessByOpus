import * as THREE from 'three'
import { SAND } from '@/three/constants/desertField'

/**
 * Texture procédurale de SABLE (canvas → CanvasTexture répétable) : fond tan
 * chaud, larges taches claires/sombres (variations de densité), stries de vent
 * quasi horizontales (ripples éoliens) et grain fin. Aucune image externe.
 * Fonction pure — appelée une fois, la texture est répétée sur tout le sol.
 */
export function createSandTexture(): THREE.CanvasTexture {
  const S = SAND.textureSize
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!

  // Fond tan uniforme.
  ctx.fillStyle = SAND.base
  ctx.fillRect(0, 0, S, S)

  // Larges taches douces claires/sombres (variations naturelles du sable).
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * S
    const y = Math.random() * S
    const r = S * (0.12 + Math.random() * 0.2)
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    const tint = Math.random() < 0.5 ? SAND.light : SAND.dark
    grad.addColorStop(0, `${tint}30`) // alpha ~0.19 en hex
    grad.addColorStop(1, `${tint}00`)
    ctx.fillStyle = grad
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  // Stries de vent : ondulations quasi horizontales, sombres et discrètes.
  ctx.strokeStyle = `${SAND.ripple}22`
  ctx.lineWidth = 1.6
  for (let i = 0; i < 26; i++) {
    const y0 = Math.random() * S
    const amp = 2 + Math.random() * 4
    const freq = 0.02 + Math.random() * 0.03
    ctx.beginPath()
    for (let x = 0; x <= S; x += 4) {
      const y = y0 + Math.sin(x * freq + i) * amp
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Grain fin : poivrage clair/sombre.
  for (let i = 0; i < 3200; i++) {
    const light = Math.random() < 0.5
    ctx.fillStyle = light ? `${SAND.light}26` : `${SAND.dark}26`
    ctx.fillRect(Math.random() * S, Math.random() * S, 1, 1)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.needsUpdate = true
  return texture
}
