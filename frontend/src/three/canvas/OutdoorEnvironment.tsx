import { Environment } from '@react-three/drei'
import { ENVIRONMENT_PRESET, ENVIRONMENT_INTENSITY } from '@/three/constants/launchDaylight'

/**
 * Environnement image-based (IBL) : HDRI d'extérieur au coucher de soleil, pour
 * des reflets chauds et réalistes sur les métaux (rampe, radar, Mesange) et,
 * plus tard, sur l'eau. `background={false}` : on garde le ciel physique <Sky>
 * en fond, l'HDRI ne sert qu'à l'éclairage/réflexion. Chargé une fois.
 */
export function OutdoorEnvironment() {
  return <Environment preset={ENVIRONMENT_PRESET} environmentIntensity={ENVIRONMENT_INTENSITY} background={false} />
}
