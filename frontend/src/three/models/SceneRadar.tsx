import { RadarModel } from './RadarModel'
import { RadarCoverageVolume } from './RadarCoverageVolume'
import { sampleSceneGround } from '@/lib/sampleSceneGround'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'
import type { RadarConfig } from '@/types/radar.types'

interface SceneRadarProps {
  config: RadarConfig
  /** Décalage scène (direction réelle depuis le pas de tir, distance bornée). */
  offset: SceneOffset
  /** Mètres réels → unités scène (map fixe, voir computeSceneScale) — dimensionne
   *  le volume de détection (voir RadarCoverageVolume) à la bonne échelle. */
  metersPerSceneUnit: number
}

// Taille apparente des radars dans la scène : rayon englobant cible en unités.
// Ce sont de gros véhicules/systèmes radar (grand camion radar) : rayon
// CONSIDÉRABLEMENT relevé (40 → 95, rendu maximal, voir feedback_gpu_budget)
// pour qu'ils dominent franchement le pas de tir, visibles de très loin.
const RADAR_TARGET_RADIUS = 95

/**
 * Un radar posé dans la scène de lancement, à sa direction géographique réelle
 * (distance bornée = repère de contexte, cf. computeRadarSceneOffset), dimensionné
 * pour dominer le pas de tir. Posé au ras du sol à sa position. Rendu seul.
 */
export function SceneRadar({ config, offset, metersPerSceneUnit }: SceneRadarProps) {
  const groundY = sampleSceneGround(offset.x, offset.z)

  return (
    <group position={[offset.x, groundY, offset.z]}>
      <RadarModel
        modelPath={config.modelPath}
        tintColor={config.tintColor}
        targetRadius={RADAR_TARGET_RADIUS}
        // Ombres portées activées (rendu maximal) : à cette taille, un radar
        // sans ombre propre paraît flotter au-dessus du sol.
        shadows
        spinMode="none"
      />
      {/* Volume réel de détection (voir RadarCoverageVolume) : pas de decalage
          Y ici — son profil encode déjà l'altitude ABSOLUE depuis le sol
          (base à antennaHeightM, voir computeCoverageLobeHalf), donc le groupe
          `SceneRadar` (déjà posé à groundY) est le bon repère. */}
      <RadarCoverageVolume config={config} metersPerSceneUnit={metersPerSceneUnit} />
    </group>
  )
}
