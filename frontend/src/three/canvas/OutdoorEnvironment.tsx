import { Environment } from '@react-three/drei'
import { ENVIRONMENT_PRESET, ENVIRONMENT_INTENSITY } from '@/three/constants/launchDaylight'
import { NIGHT_ENVIRONMENT_PRESET, NIGHT_ENVIRONMENT_INTENSITY } from '@/three/constants/launchNight'
import type { SceneMode } from '@/types/scene.types'

interface OutdoorEnvironmentProps {
  /** Ambiance : coucher de soleil (jour) ou HDRI nocturne (nuit). */
  mode?: SceneMode
}

/**
 * Environnement image-based (IBL) : HDRI d'extérieur — coucher de soleil le
 * jour (reflets chauds sur les métaux), nocturne la nuit (reflets froids
 * discrets). `background={false}` : le fond reste le ciel (Sky ou étoiles),
 * l'HDRI ne sert qu'à l'éclairage/réflexion.
 */
export function OutdoorEnvironment({ mode = 'day' }: OutdoorEnvironmentProps) {
  const night = mode === 'night'
  return (
    <Environment
      preset={night ? NIGHT_ENVIRONMENT_PRESET : ENVIRONMENT_PRESET}
      environmentIntensity={night ? NIGHT_ENVIRONMENT_INTENSITY : ENVIRONMENT_INTENSITY}
      background={false}
    />
  )
}
