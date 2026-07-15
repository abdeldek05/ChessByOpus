import { useUnifiedTerrainGeometry } from '@/three/hooks/useUnifiedTerrainGeometry'
import { useTerrainSplatMaterial } from '@/three/hooks/useTerrainSplatMaterial'
import type { SceneBiome } from '@/types/scene.types'

interface UnifiedTerrainProps {
  biome: SceneBiome
  /** Rayon extérieur du terrain (unités) — couvre la vraie distance du scénario. */
  outerRadius: number
}

/**
 * TERRAIN UNIFIÉ : un seul sol continu du pas de tir jusqu'à l'horizon, sans la
 * couture proche/lointain de l'ancien système. Géométrie à densité dégressive
 * (hook) + matériau de SPLATTING par biome (prairie : gazon dominant + micro-
 * relief ; désert : terre dominante historique). Rendu JSX uniquement.
 */
export function UnifiedTerrain({ biome, outerRadius }: UnifiedTerrainProps) {
  const geometry = useUnifiedTerrainGeometry({ biome, outerRadius })
  const material = useTerrainSplatMaterial(biome)

  return (
    <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
  )
}
