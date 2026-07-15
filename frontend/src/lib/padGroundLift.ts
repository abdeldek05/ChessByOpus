import { sampleTerrainHeight } from '@/lib/sampleTerrainHeight'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { PAD_TIERS } from '@/three/constants/launchComplex'
import type { SceneBiome } from '@/types/scene.types'

/**
 * Hauteurs du relief sous l'emprise de la plateforme de lancement (carré de
 * demi-côté `half` autour du pas de tir), échantillonnées sur une grille. Sert à
 * asseoir la plateforme : on descend son socle jusqu'au relief le plus BAS (pas
 * de trou dessous) et on la relève au-dessus du plus HAUT (jamais enfoncée).
 * Fonction pure — dépend du biome (le relief diffère prairie/désert).
 */
export function padGroundExtent(half: number, biome: SceneBiome): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  const steps = 6
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const x = LAUNCH_CENTER[0] + (i / steps - 0.5) * 2 * half
      const z = LAUNCH_CENTER[2] + (j / steps - 0.5) * 2 * half
      const y = sampleTerrainHeight(x, z, biome)
      if (y < min) min = y
      if (y > max) max = y
    }
  }
  return { min, max }
}

// Le relèvement est une fonction pure du biome : on le mémoïse par biome pour
// éviter de rééchantillonner la grille à chaque appel (appelé au niveau module
// par sampleSceneGround et par LaunchPad).
const padLiftCache = new Map<SceneBiome, number>()

/**
 * Relèvement (unités) appliqué à toute la zone de lancement pour que le socle
 * dépasse toujours le relief le plus haut sous son emprise. Formule PARTAGÉE
 * entre LaunchPad (qui relève la plateforme) et le canvas (qui relève rampe +
 * console + vol de la même quantité), pour rester alignés. Biome-aware : en
 * désert la dalle se relève au-dessus des dunes, plus au-dessus du relief de
 * prairie (bug corrigé).
 */
export function computePadLift(biome: SceneBiome = 'meadow'): number {
  const cached = padLiftCache.get(biome)
  if (cached !== undefined) return cached
  const extent = padGroundExtent(PAD_TIERS[0].half, biome)
  const lift = Math.max(0, extent.max + 0.3 - PAD_TIERS[0].top)
  padLiftCache.set(biome, lift)
  return lift
}
