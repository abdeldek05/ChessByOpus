import { RadarModel } from './RadarModel'
import { sampleLawnRelief } from '@/lib/sampleLawnRelief'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'
import type { RadarConfig } from '@/types/radar.types'

interface SceneRadarProps {
  config: RadarConfig
  /** Décalage scène (direction réelle depuis le pas de tir, distance bornée). */
  offset: SceneOffset
}

// Taille apparente des radars dans la scène : rayon englobant cible en unités.
// Ce sont de gros véhicules/systèmes radar : rayon relevé pour qu'ils soient
// bien massifs et lisibles de loin dans la map (avant : 9, trop petit).
const RADAR_TARGET_RADIUS = 16

/**
 * Un radar posé dans la scène de lancement, à sa direction géographique réelle
 * (distance bornée = repère de contexte, cf. computeRadarSceneOffset), dimensionné
 * pour dominer le pas de tir. Posé au ras du relief à sa position (le sol ondule
 * hors de la zone plate du banc de tir). Rendu seul.
 */
export function SceneRadar({ config, offset }: SceneRadarProps) {
  // Hauteur du terrain sous le radar : le colle au sol même sur les ondulations.
  const groundY = sampleLawnRelief(offset.x, offset.z)

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
