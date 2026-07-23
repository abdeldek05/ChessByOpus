import * as THREE from 'three'
import { useFarHorizonGeometry } from '@/three/hooks/useFarHorizonGeometry'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { FOG_COLOR } from '@/three/constants/launchDaylight'

// Teinte des collines lointaines : LÉGÈREMENT plus sombre/froide que la
// couleur du fog (pas identique) — sinon la silhouette disparaîtrait
// totalement au lieu de casser doucement la ligne d'horizon plate.
const HORIZON_COLOR = new THREE.Color(FOG_COLOR).multiplyScalar(0.72)

/**
 * Anneau de collines silhouette posé sur le sol plat lointain (voir
 * useFarHorizonGeometry) — remplit la ligne d'horizon jusque-là nue (sol plat
 * uniforme jusqu'à FAR_GROUND_RADIUS) sans coût de relief réel : géométrie
 * statique low-poly, MeshBasicMaterial (pas d'éclairage — jamais vue de
 * près, la silhouette flat-shaded suffit), fondue dans le fog exponentiel de
 * la scène (voir LaunchSceneCanvas) au lieu d'un bord net.
 */
export function FarHorizon() {
  const geometry = useFarHorizonGeometry()

  return (
    <mesh geometry={geometry} position={LAUNCH_CENTER}>
      <meshBasicMaterial color={HORIZON_COLOR} fog />
    </mesh>
  )
}
