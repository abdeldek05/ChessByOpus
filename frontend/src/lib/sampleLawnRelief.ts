import { RELIEF_WAVES, FLAT_RADIUS, FLAT_FALLOFF } from '@/three/constants/lawnRelief'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'

/**
 * Hauteur du terrain (Y) en un point (x, z) MONDE du plan de sol : somme de
 * quelques sinusoïdes basses fréquences, aplanie à zéro dans un disque autour
 * du banc de tir (LAUNCH_CENTER) pour qu'il repose à plat. Fonction pure et
 * déterministe — réutilisable pour poser tout objet au ras du relief.
 */
export function sampleLawnRelief(x: number, z: number): number {
  let height = 0
  for (const wave of RELIEF_WAVES) {
    height +=
      wave.amplitude *
      Math.sin(x * wave.freqX + wave.phase) *
      Math.cos(z * wave.freqZ + wave.phase * 0.5)
  }

  // Fondu du plat central (0 dans le disque autour de la base) vers le relief
  // plein (1 au-delà).
  const distance = Math.hypot(x - LAUNCH_CENTER[0], z - LAUNCH_CENTER[2])
  const flatness = smoothstep(FLAT_RADIUS, FLAT_RADIUS + FLAT_FALLOFF, distance)
  return height * flatness
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
