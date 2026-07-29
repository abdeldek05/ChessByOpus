import { useMemo } from 'react'
import {
  PHOTO_MODE,
  PHOTO_METAL_ENV_INTENSITY,
  PHOTO_METAL_ROUGHNESS,
} from '@/three/constants/photoMode'

/** Props PBR à étaler sur un `<meshStandardMaterial>` métallique du pas de tir. */
export interface PadMetalProps {
  roughness: number
  metalness: number
  envMapIntensity: number
}

/**
 * Réglage PBR commun aux pièces MÉTALLIQUES du pas de tir (rambardes, mâts,
 * tuyauterie, ferrures) : un seul endroit décide de leur aspect, au lieu de
 * répéter `roughness`/`metalness` sur chaque mesh.
 *
 * En MODE PHOTO, le métal passe en inox poli : rugosité abaissée et reflets
 * d'environnement (HDRI golden hour) fortement montés — les surfaces accrochent
 * alors le soleil et le ciel au lieu de rester d'un gris mat uniforme. La
 * rugosité ne descend jamais à 0 : un métal parfaitement lisse lit « plastique »,
 * l'inox réel garde un fin brossage qui étire les reflets.
 *
 * @param baseRoughness rugosité en usage normal (défaut 0.4, valeur des rambardes)
 * @param metalness     métallicité, inchangée par le mode photo
 */
export function usePadMetalProps(baseRoughness = 0.4, metalness = 0.7): PadMetalProps {
  return useMemo(
    () => ({
      roughness: PHOTO_MODE ? Math.min(baseRoughness, PHOTO_METAL_ROUGHNESS) : baseRoughness,
      metalness: PHOTO_MODE ? Math.max(metalness, 0.85) : metalness,
      envMapIntensity: PHOTO_MODE ? PHOTO_METAL_ENV_INTENSITY : 1,
    }),
    [baseRoughness, metalness],
  )
}
