import * as THREE from 'three'
import { useRadarCoverageGeometry } from '@/three/hooks/useRadarCoverageGeometry'
import { ROLE_COLOR } from '@/constants/tacticalMapTheme'
import type { RadarConfig } from '@/types/radar.types'

interface RadarCoverageVolumeProps {
  config: RadarConfig
  /** Mètres réels → unités scène (map fixe, voir computeSceneScale). */
  metersPerSceneUnit: number
}

/**
 * Le volume RÉEL de détection d'un radar, posé sur lui dans la scène 3D :
 * un dôme translucide pincé au sommet (cône de silence — la menace y
 * « disparaît » en montant trop près/trop haut) et à la base (masque
 * d'horizon). Même géométrie EXACTE que le lobe 2D du débrief/profil tactique
 * (voir useRadarCoverageGeometry → computeCoverageLobeHalf) — ce que
 * l'utilisateur voit ici est cohérent avec ce qu'il lit ailleurs, pas une
 * approximation refaite pour la 3D.
 *
 * Teinté dans la couleur d'alerte (ROLE_COLOR.KING) : c'est le volume qui
 * concerne la menace réelle, cohérent avec le bandeau HUD live
 * (DetectionStatusHud) et le profil vertical qui utilisent la même teinte.
 */
export function RadarCoverageVolume({ config, metersPerSceneUnit }: RadarCoverageVolumeProps) {
  const geometry = useRadarCoverageGeometry(config, metersPerSceneUnit)

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={ROLE_COLOR.KING}
        transparent
        opacity={0.05}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
