import { RadarModel } from './RadarModel'
import { sampleSceneGround } from '@/lib/sampleSceneGround'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'
import type { RadarConfig } from '@/types/radar.types'
import type { SceneBiome } from '@/types/scene.types'

interface SceneRadarProps {
  config: RadarConfig
  /** Décalage scène (direction réelle depuis le pas de tir, distance bornée). */
  offset: SceneOffset
  /** Biome du terrain : le radar se pose sur le sol correspondant (dunes...). */
  biome?: SceneBiome
}

// Taille apparente des radars dans la scène : rayon englobant cible en unités.
// Ce sont de gros véhicules/systèmes radar : rayon relevé pour qu'ils soient
// bien massifs et lisibles de loin dans la map (avant : 9, trop petit).
const RADAR_TARGET_RADIUS = 16

/**
 * Un radar posé dans la scène de lancement, à sa direction géographique réelle
 * (distance bornée = repère de contexte, cf. computeRadarSceneOffset), dimensionné
 * pour dominer le pas de tir. Posé au ras du SOL DU BIOME (ondulations de
 * prairie OU dunes du désert) à sa position. Rendu seul.
 */
export function SceneRadar({ config, offset, biome }: SceneRadarProps) {
  // Hauteur du terrain sous le radar : le colle au sol du biome courant.
  const groundY = sampleSceneGround(offset.x, offset.z, biome)

  return (
    <group position={[offset.x, groundY, offset.z]}>
      <RadarModel
        modelPath={config.modelPath}
        tintColor={config.tintColor}
        targetRadius={RADAR_TARGET_RADIUS}
        shadows={false}
        spinMode="none"
      />
    </group>
  )
}
