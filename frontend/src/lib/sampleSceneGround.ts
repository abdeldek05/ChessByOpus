import { sampleTerrainHeight } from '@/lib/sampleTerrainHeight'
import { computePadLift } from '@/lib/padGroundLift'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { PAD_TIERS } from '@/three/constants/launchComplex'
import type { SceneBiome } from '@/types/scene.types'

/**
 * Hauteur du SOL de la scène (Y monde) en un point (x, z) : le relief unifié du
 * BIOME (sampleTerrainHeight, valable partout — plus d'incohérence au-delà de
 * l'ancienne zone proche), RELEVÉ au niveau des gradins béton sous l'emprise de
 * la plateforme de lancement. Sert de sol de COLLISION unique : le vol se brise
 * dessus (dalle comprise) et la caméra ne passe ni sous la map ni sous la
 * plateforme. Fonction pure et déterministe.
 */
export function sampleSceneGround(x: number, z: number, biome: SceneBiome = 'meadow'): number {
  // Relèvement de la plateforme : fonction pure du relief, mémoïsée par biome.
  const padLift = computePadLift(biome)
  let ground = sampleTerrainHeight(x, z, biome)
  // Distance « carrée » (Chebyshev) au centre du pas de tir : les gradins sont
  // des carrés concentriques — le plus étroit (le plus haut) gagne.
  const chebyshev = Math.max(Math.abs(x - LAUNCH_CENTER[0]), Math.abs(z - LAUNCH_CENTER[2]))
  for (const tier of PAD_TIERS) {
    if (chebyshev <= tier.half) ground = Math.max(ground, tier.top + padLift)
  }
  return ground
}
