import { RadarModel } from './RadarModel'
import { sampleSceneGround } from '@/lib/sampleSceneGround'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'
import type { RadarConfig } from '@/types/radar.types'

interface SceneRadarProps {
  config: RadarConfig
  /** Décalage scène (direction réelle depuis le pas de tir, distance bornée). */
  offset: SceneOffset
}

// Taille apparente des radars dans la scène : rayon englobant cible en unités.
// Ce sont de gros véhicules/systèmes radar (grand camion radar) : rayon
// nettement relevé (16 → 40) pour qu'ils dominent vraiment le pas de tir et
// restent lisibles de loin — les modèles GLB paraissaient trop petits.
const RADAR_TARGET_RADIUS = 40

/**
 * Un radar posé dans la scène de lancement, à sa direction géographique réelle
 * (distance bornée = repère de contexte, cf. computeRadarSceneOffset), dimensionné
 * pour dominer le pas de tir. Posé au ras du sol à sa position. Rendu seul.
 */
export function SceneRadar({ config, offset }: SceneRadarProps) {
  const groundY = sampleSceneGround(offset.x, offset.z)

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
