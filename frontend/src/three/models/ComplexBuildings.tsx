import { sampleSceneGround } from '@/lib/sampleSceneGround'
import { BUILDINGS } from '@/three/constants/launchComplex'
import type { SceneBiome } from '@/types/scene.types'

interface ComplexBuildingsProps {
  /** Biome du terrain : les bâtiments se posent sur le sol correspondant. */
  biome?: SceneBiome
}

/**
 * Bâtiments techniques du complexe (blockhaus, hangar) : simples volumes posés
 * au ras du SOL DU BIOME à leur position. Rendu seul — positions/tailles en
 * constantes.
 */
export function ComplexBuildings({ biome }: ComplexBuildingsProps) {
  return (
    <group>
      {BUILDINGS.map((b, i) => {
        const [x, z] = b.pos
        const [w, h, d] = b.size
        const y = sampleSceneGround(x, z, biome)
        return (
          <mesh key={i} position={[x, y + h / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={b.color} roughness={0.8} metalness={0.1} />
          </mesh>
        )
      })}
    </group>
  )
}
