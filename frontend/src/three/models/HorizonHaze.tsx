import { useHorizonHazeGeometry } from '@/three/hooks/useHorizonHazeGeometry'
import { useHorizonHazeMaterial } from '@/three/hooks/useHorizonHazeMaterial'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { HAZE_BASE_Y } from '@/three/constants/horizonHaze'

/**
 * Coque cylindrique de brume à l'horizon (voir useHorizonHazeGeometry /
 * useHorizonHazeMaterial) : remplace l'approche billboard (drei <Cloud>,
 * jugée trop enfantine — sprites plats qui se révèlent de côté) par une
 * nappe de vapeur diffuse qui avale la ligne de coupure du sol lointain,
 * dense au ras du sol et transparente en montant vers le ciel dégagé. Vue de
 * l'INTÉRIEUR uniquement (BackSide, voir le matériau) — jamais franchie par
 * la caméra dans le jeu normal (rayon bien au-delà de la zone jouable).
 */
export function HorizonHaze() {
  const geometry = useHorizonHazeGeometry()
  const material = useHorizonHazeMaterial()

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[LAUNCH_CENTER[0], HAZE_BASE_Y, LAUNCH_CENTER[2]]}
      renderOrder={10}
    />
  )
}
