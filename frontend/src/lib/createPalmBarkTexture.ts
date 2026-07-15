import * as THREE from 'three'

// Palette de l'écorce du palmier-dattier (stipe fibreux à écailles).
const BARK_BASE = '#8f6f4a'
const BARK_DARK = '#6e5335'
const BARK_LIGHT = '#a98a60'

let cached: THREE.CanvasTexture | null = null

/**
 * Texture procédurale d'ÉCORCE de palmier-dattier : motif d'écailles en
 * quinconce (cicatrices des anciennes palmes) + fibres verticales. Le stipe
 * texturé remplace le cylindre lisse « cartoon ». Générée une fois (cache
 * module) et répétée le long du tronc. Fonction pure.
 */
export function createPalmBarkTexture(): THREE.CanvasTexture {
  if (cached) return cached

  const W = 128
  const H = 256
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = BARK_BASE
  ctx.fillRect(0, 0, W, H)

  // Écailles en quinconce : rangées de trapèzes, ombrés en bas, éclairés en haut.
  const rows = 12
  const cols = 5
  const rowH = H / rows
  const colW = W / cols
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (colW / 2)
    for (let c = -1; c < cols + 1; c++) {
      const x = c * colW + offset
      const y = r * rowH
      // Corps de l'écaille : dégradé vertical clair → sombre.
      const grad = ctx.createLinearGradient(0, y, 0, y + rowH)
      grad.addColorStop(0, BARK_LIGHT)
      grad.addColorStop(0.55, BARK_BASE)
      grad.addColorStop(1, BARK_DARK)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.moveTo(x + 3, y + 2)
      ctx.lineTo(x + colW - 3, y + 2)
      ctx.lineTo(x + colW - 8, y + rowH - 2)
      ctx.lineTo(x + 8, y + rowH - 2)
      ctx.closePath()
      ctx.fill()
      // Liséré sombre sous l'écaille (relief).
      ctx.fillStyle = `${BARK_DARK}aa`
      ctx.fillRect(x + 4, y + rowH - 4, colW - 8, 3)
    }
  }

  // Fibres verticales discrètes par-dessus.
  ctx.strokeStyle = `${BARK_DARK}30`
  ctx.lineWidth = 1
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W
    ctx.beginPath()
    ctx.moveTo(x, Math.random() * H * 0.4)
    ctx.lineTo(x + (Math.random() - 0.5) * 6, H)
    ctx.stroke()
  }

  cached = new THREE.CanvasTexture(canvas)
  cached.colorSpace = THREE.SRGBColorSpace
  cached.wrapS = THREE.RepeatWrapping
  cached.wrapT = THREE.RepeatWrapping
  cached.needsUpdate = true
  return cached
}
