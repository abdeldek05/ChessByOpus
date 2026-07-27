import { Environment, Stars } from '@react-three/drei'
import { HDRI_PATH, ENVIRONMENT_INTENSITY } from '@/three/constants/launchDaylight'
import { NIGHT_SKY_COLOR, NIGHT_ENVIRONMENT_INTENSITY } from '@/three/constants/launchNight'
import type { SceneMode } from '@/types/scene.types'

interface EnvironmentSkyProps {
  /** Ambiance : jour (HDRI golden hour) ou nuit (ciel sombre + étoiles). */
  mode: SceneMode
}

/**
 * Ciel + éclairage image de la scène, selon l'ambiance :
 *
 * - JOUR : vraie HDRI golden hour (fond visible + IBL PBR complet, halo solaire
 *   et nuages capturés dans la photo). Voir launchDaylight.
 * - NUIT : pas de HDRI nuit disponible → fond de ciel sombre uni (couleur de
 *   scène) + champ d'étoiles (drei <Stars>), avec une IBL golden hour très
 *   ATTÉNUÉE (NIGHT_ENVIRONMENT_INTENSITY) juste pour garder des reflets
 *   métalliques crédibles sans éclairer la scène — l'éclairage nuit vient
 *   surtout de SunLight (clair de lune froid faible, voir launchNight).
 *
 * `mode` était auparavant une prop MORTE (le bouton ☀/☾ ne changeait rien) —
 * c'est ici qu'il prend enfin effet.
 */
export function EnvironmentSky({ mode }: EnvironmentSkyProps) {
  if (mode === 'night') {
    return (
      <>
        {/* Fond de ciel nuit uni (couleur de scène, pas une image). */}
        <color attach="background" args={[NIGHT_SKY_COLOR]} />
        {/* Champ d'étoiles très lointain, quasi statique — habite le ciel noir. */}
        <Stars radius={4000} depth={900} count={6000} factor={22} saturation={0} fade speed={0.15} />
        {/* IBL golden hour gardée en sourdine : reflets métal discrets, sans
            éclairer la scène (l'ambiance nuit vient de SunLight). background=false
            → ne remplace pas le fond sombre ci-dessus. */}
        <Environment files={HDRI_PATH} environmentIntensity={NIGHT_ENVIRONMENT_INTENSITY} />
      </>
    )
  }

  return <Environment files={HDRI_PATH} background environmentIntensity={ENVIRONMENT_INTENSITY} />
}
