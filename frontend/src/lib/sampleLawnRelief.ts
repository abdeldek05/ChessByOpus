import { RELIEF_WAVES, FLAT_RADIUS, FLAT_FALLOFF, HILLS } from '@/three/constants/lawnRelief'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'

/**
 * Hauteur du terrain (Y) en un point (x, z) MONDE du plan de sol : ondulations
 * douces locales (aplanies autour du pas de tir) + une CHAÎNE DE COLLINES
 * marquée d'un seul côté (au nord, vers -Z) qui monte à l'horizon. Fonction pure
 * et déterministe — réutilisable pour poser tout objet au ras du relief.
 */
export function sampleLawnRelief(x: number, z: number): number {
  // --- Ondulations locales douces ---
  let height = 0
  for (const wave of RELIEF_WAVES) {
    height +=
      wave.amplitude *
      Math.sin(x * wave.freqX + wave.phase) *
      Math.cos(z * wave.freqZ + wave.phase * 0.5)
  }
  const distance = Math.hypot(x - LAUNCH_CENTER[0], z - LAUNCH_CENTER[2])
  const flatness = smoothstep(FLAT_RADIUS, FLAT_RADIUS + FLAT_FALLOFF, distance)
  let y = height * flatness

  // --- Collines d'un seul côté (nord, -Z) qui montent en s'éloignant ---
  const dz = LAUNCH_CENTER[2] - z // > 0 côté nord (z plus petit que le centre)
  if (dz > HILLS.startZ) {
    // Montée progressive de 0 (à startZ) à 1 (à fullZ).
    const rise = smoothstep(HILLS.startZ, HILLS.fullZ, dz)
    // Crêtes ondulées : profil de collines toujours ≥ 0 (½(1+sin) → 0..1).
    const ridge =
      0.5 *
      (1 +
        Math.sin(x * HILLS.ridgeFreqX + HILLS.ridgePhase) *
          Math.cos(z * HILLS.ridgeFreqZ))
    y += HILLS.amplitude * rise * ridge
  }

  return y
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
