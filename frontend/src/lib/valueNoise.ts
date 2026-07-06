import { createSeededRandom } from '@/lib/createSeededRandom'

/**
 * Bruit de valeur 2D lissé + fBm (fractal Brownian motion), déterministe.
 * Sert à générer des textures de terrain « propres » (mottling doux, relief
 * micro) sans dessiner de traits — le rendu ressemble à un champ, pas à des
 * brins peints un par un.
 */
export interface ValueNoise2D {
  /** Valeur de bruit lissée en (x, y), dans [0, 1]. */
  noise: (x: number, y: number) => number
  /** Somme d'octaves (fBm) en (x, y), normalisée dans [0, 1]. */
  fbm: (x: number, y: number, octaves: number) => number
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

/**
 * Construit un bruit de valeur sur une grille torique de `gridSize` cellules
 * (répétable sans couture), avec interpolation bilinéaire lissée.
 */
export function createValueNoise2D(seed: number, gridSize: number): ValueNoise2D {
  const rand = createSeededRandom(seed)
  const lattice = new Float32Array(gridSize * gridSize)
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand()

  const at = (ix: number, iy: number): number => {
    const wx = ((ix % gridSize) + gridSize) % gridSize
    const wy = ((iy % gridSize) + gridSize) % gridSize
    return lattice[wy * gridSize + wx]
  }

  const noise = (x: number, y: number): number => {
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const fx = smoothstep(x - x0)
    const fy = smoothstep(y - y0)
    const v00 = at(x0, y0)
    const v10 = at(x0 + 1, y0)
    const v01 = at(x0, y0 + 1)
    const v11 = at(x0 + 1, y0 + 1)
    const top = v00 + (v10 - v00) * fx
    const bottom = v01 + (v11 - v01) * fx
    return top + (bottom - top) * fy
  }

  const fbm = (x: number, y: number, octaves: number): number => {
    let value = 0
    let amplitude = 0.5
    let frequency = 1
    let totalAmplitude = 0
    for (let o = 0; o < octaves; o++) {
      value += amplitude * noise(x * frequency, y * frequency)
      totalAmplitude += amplitude
      amplitude *= 0.5
      frequency *= 2
    }
    return value / totalAmplitude
  }

  return { noise, fbm }
}
