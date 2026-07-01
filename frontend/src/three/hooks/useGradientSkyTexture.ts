import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Dégradé vertical utilisé en fond de scène (plein écran). Reconstruit
 * uniquement quand les couleurs changent (bascule jour/nuit).
 */
export function useGradientSkyTexture(topColor: string, horizonColor: string): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 256)
      gradient.addColorStop(0, topColor)
      gradient.addColorStop(1, horizonColor)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 2, 256)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [topColor, horizonColor])
}
