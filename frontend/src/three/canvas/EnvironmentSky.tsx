import { Environment } from '@react-three/drei'
import { HDRI_PATH, ENVIRONMENT_INTENSITY } from '@/three/constants/launchDaylight'

/**
 * Ciel + éclairage image (IBL) depuis une VRAIE HDRI golden hour (photo réelle :
 * ciel, nuages, halo solaire, tout capturé) — remplace le ciel procédural
 * Preetham + le disque solaire bricolé + les nuages billboard (rendu plat,
 * hautes lumières qui « flashaient »). Sert à la fois de fond visible
 * (`background`) et de source de lumière ambiante/reflets (`environmentIntensity`)
 * pour tous les matériaux PBR de la scène. Doit être monté dans un `<Suspense>`
 * local (chargement réseau/disque, ne doit jamais blanchir le reste de la scène
 * en attendant). La direction du soleil DANS cette HDRI est mesurée dans
 * `launchDaylight.ts` (SKY.elevationDeg/azimuthDeg) — SunLight s'y aligne.
 */
export function EnvironmentSky() {
  return <Environment files={HDRI_PATH} background environmentIntensity={ENVIRONMENT_INTENSITY} />
}
