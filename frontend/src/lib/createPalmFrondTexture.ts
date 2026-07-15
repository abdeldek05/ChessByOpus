import * as THREE from 'three'

/** Palette d'une palme : rachis central, base et pointe des folioles. */
export interface FrondPalette {
  rachis: string
  leafBase: string
  leafTip: string
}

/** Palme VERTE (vivante) et palme SÈCHE (morte, pendante sous la couronne). */
export const FROND_GREEN: FrondPalette = { rachis: '#6b7a3a', leafBase: '#2f5a24', leafTip: '#7fa04a' }
export const FROND_DRY: FrondPalette = { rachis: '#9a7f4e', leafBase: '#8a6f42', leafTip: '#c2a468' }

const cache = new Map<string, THREE.CanvasTexture>()

/**
 * Texture procédurale d'une PALME PENNÉE (fond transparent) : rachis central
 * effilé + dizaines de folioles fines des deux côtés, plus longues à la base,
 * dégradé sombre→clair vers les pointes, quelques manques naturels. Appliquée
 * avec alphaTest sur un plan ARQUÉ, elle remplace les triangles « cartoon ».
 * Cachée par palette (verte/sèche). Fonction pure.
 */
export function createPalmFrondTexture(palette: FrondPalette = FROND_GREEN): THREE.CanvasTexture {
  const key = `${palette.rachis}|${palette.leafBase}|${palette.leafTip}`
  const hit = cache.get(key)
  if (hit) return hit

  const S = 256
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, S, S)

  const cx = S / 2
  // Rachis : trait central effilé, de la base (bas) à la pointe (haut).
  const rachisGrad = ctx.createLinearGradient(cx, S, cx, 0)
  rachisGrad.addColorStop(0, palette.rachis)
  rachisGrad.addColorStop(1, palette.leafTip)
  ctx.strokeStyle = rachisGrad
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(cx, S)
  ctx.lineTo(cx, 8)
  ctx.stroke()

  // Folioles : paires de lamelles fines, longues à la base → courtes en pointe.
  const leaflets = 34
  for (let i = 0; i < leaflets; i++) {
    const t = i / (leaflets - 1) // 0 = base, 1 = pointe
    const y = S - 14 - t * (S - 30)
    if (Math.random() < 0.07) continue // manques naturels
    const length = (1 - t) * S * 0.34 + S * 0.06
    const upward = 24 + t * 26 // folioles de plus en plus dressées vers la pointe
    const angleRad = (upward * Math.PI) / 180
    const dx = Math.cos(angleRad) * length
    const dy = Math.sin(angleRad) * length

    for (const side of [-1, 1]) {
      const grad = ctx.createLinearGradient(cx, y, cx + side * dx, y - dy)
      grad.addColorStop(0, palette.leafBase)
      grad.addColorStop(1, palette.leafTip)
      ctx.fillStyle = grad
      // Lamelle = triangle très fin, léger jitter d'angle par foliole.
      const jitter = (Math.random() - 0.5) * 6
      ctx.beginPath()
      ctx.moveTo(cx, y - 2)
      ctx.lineTo(cx, y + 2)
      ctx.lineTo(cx + side * dx + jitter, y - dy + jitter)
      ctx.closePath()
      ctx.fill()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  cache.set(key, texture)
  return texture
}
