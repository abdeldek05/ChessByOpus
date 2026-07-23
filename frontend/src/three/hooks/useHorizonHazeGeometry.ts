import { useMemo } from 'react'
import * as THREE from 'three'
import { HAZE_RADIUS, HAZE_HEIGHT, HAZE_SEGMENTS } from '@/three/constants/horizonHaze'

/**
 * Géométrie de la coque de brume (voir HorizonHaze.tsx) : un cylindre OUVERT
 * (paroi seule, pas de capuchons haut/bas — jamais vu de dessus/dessous),
 * avec des UV qui répètent U sur le tour complet (pour le tuilage de bruit,
 * voir useHorizonHazeMaterial) et V de 0 (base) à 1 (sommet), utilisé comme
 * `vUv.y` pour le dégradé vertical côté shader.
 */
export function useHorizonHazeGeometry(): THREE.CylinderGeometry {
  return useMemo(() => {
    const geometry = new THREE.CylinderGeometry(
      HAZE_RADIUS,
      HAZE_RADIUS,
      HAZE_HEIGHT,
      HAZE_SEGMENTS,
      1,
      true, // openEnded : pas de capuchons
    )
    // Le shader lit vLocalY (position brute) pour le dégradé — CylinderGeometry
    // est centrée sur son origine (Y ∈ [-h/2, h/2]) ; on la translate pour que
    // Y=0 corresponde à la base (cohérent avec HAZE_BASE_Y en position monde).
    geometry.translate(0, HAZE_HEIGHT / 2, 0)
    return geometry
  }, [])
}
