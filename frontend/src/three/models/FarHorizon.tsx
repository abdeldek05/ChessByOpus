import { useMemo } from 'react'
import * as THREE from 'three'
import { useFarHorizonGeometry } from '@/three/hooks/useFarHorizonGeometry'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { FOG_COLOR } from '@/three/constants/launchDaylight'
import { NIGHT_FOG_COLOR } from '@/three/constants/launchNight'
import type { SceneMode } from '@/types/scene.types'

interface FarHorizonProps {
  /** Ambiance : jour (silhouette gris fog) ou nuit (fondue dans le bleu nuit). */
  mode?: SceneMode
}

// Teinte des collines lointaines : LÉGÈREMENT plus sombre/froide que la
// couleur du fog (pas identique) — sinon la silhouette disparaîtrait
// totalement au lieu de casser doucement la ligne d'horizon plate.
const HORIZON_COLOR = new THREE.Color(FOG_COLOR).multiplyScalar(0.72)
// La nuit : dérivée du fog nuit, encore plus sombre (les collines se fondent
// dans le ciel bleu nuit au lieu de rester une bande grise éclairée).
const NIGHT_HORIZON_COLOR = new THREE.Color(NIGHT_FOG_COLOR).multiplyScalar(0.72)

/**
 * Anneau de collines silhouette posé sur le sol plat lointain (voir
 * useFarHorizonGeometry) — remplit la ligne d'horizon jusque-là nue (sol plat
 * uniforme jusqu'à FAR_GROUND_RADIUS) sans coût de relief réel : géométrie
 * statique low-poly, MeshBasicMaterial (pas d'éclairage — jamais vue de
 * près, la silhouette flat-shaded suffit), fondue dans le fog exponentiel de
 * la scène (voir LaunchSceneCanvas) au lieu d'un bord net.
 */
export function FarHorizon({ mode = 'day' }: FarHorizonProps) {
  const geometry = useFarHorizonGeometry()
  const color = useMemo(() => (mode === 'night' ? NIGHT_HORIZON_COLOR : HORIZON_COLOR), [mode])

  return (
    <mesh geometry={geometry} position={LAUNCH_CENTER}>
      <meshBasicMaterial color={color} fog />
    </mesh>
  )
}
