import { useMemo } from 'react'
import * as THREE from 'three'
import { computeCoverageLobeHalf } from '@/lib/coverage/computeCoverageLobeHalf'
import { COVERAGE_ELEVATION_MIN_DEG, COVERAGE_ELEVATION_MAX_DEG } from '@/constants/coverage'
import type { RadarConfig } from '@/types/radar.types'

// Segments de révolution autour de l'axe vertical du radar : le volume est
// symétrique en azimut (aucune directivité en gisement dans notre modèle),
// un tour complet suffit à donner une vraie sensation de dôme plutôt qu'un
// éventail à facettes visibles.
const REVOLUTION_SEGMENTS = 48

/**
 * Géométrie du VOLUME de détection d'un radar — même géométrie EXACTE que le
 * lobe 2D du débrief Analytics/du profil tactique (computeCoverageLobeHalf),
 * mais tournée à 360° autour de l'axe vertical du radar pour former un mesh
 * de révolution 3D : le dôme de portée, pincé au sommet par le cône de
 * silence (élévation max) et à la base par le masque d'horizon (élévation
 * min). C'est CE volume que la menace traverse dans la scène de vol — voir
 * RadarCoverageVolume.tsx.
 *
 * `metersPerSceneUnit` convertit les mètres réels (rangeM, ceilingM...) en
 * unités scène — même échelle que le reste de la scène 3D (offset radar,
 * trajectoire de vol), sinon le volume ne serait pas à la bonne taille par
 * rapport au reste du décor.
 */
export function useRadarCoverageGeometry(config: RadarConfig, metersPerSceneUnit: number): THREE.BufferGeometry {
  return useMemo(() => {
    const elevMinDeg = COVERAGE_ELEVATION_MIN_DEG
    const elevMaxDeg = config.elevationMaxDeg ?? COVERAGE_ELEVATION_MAX_DEG

    // Demi-profil (u, alt) EN MÈTRES, u = distance horizontale à l'axe du
    // radar, alt = altitude ABSOLUE (0 = niveau du sol au radar) — même
    // fonction que CoverageLobe (Analytics) et LaunchVerticalProfile (VCD live).
    const halfProfile = computeCoverageLobeHalf({
      rangeM: config.rangeKm * 1000,
      offAxisM: 0,
      antennaHeightM: config.antennaHeightM,
      ceilingM: config.ceilingM,
      elevMinDeg,
      elevMaxDeg,
    })

    if (!halfProfile || halfProfile.length < 2) {
      // Volume nul (plafond sous l'antenne, etc.) : géométrie vide plutôt
      // qu'un crash — SceneRadar ne monte simplement rien de visible.
      return new THREE.BufferGeometry()
    }

    const scale = 1 / metersPerSceneUnit
    // LatheGeometry tourne un profil (x=rayon, y=hauteur) autour de l'axe Y —
    // convention Three.js pile alignée avec notre (u=rayon horizontal,
    // alt=hauteur), donc conversion directe sans réarrangement d'axes.
    const points = halfProfile.map(([u, alt]) => new THREE.Vector2(Math.max(0.001, u * scale), alt * scale))

    const geometry = new THREE.LatheGeometry(points, REVOLUTION_SEGMENTS)
    return geometry
  }, [config, metersPerSceneUnit])
}
