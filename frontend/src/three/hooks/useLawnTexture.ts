import { useEffect, useMemo } from 'react'
import { createLawnTextures, type LawnTexturePack } from '@/lib/createLawnTextures'

export type LawnTextures = LawnTexturePack

/**
 * Pack de texture gazon procédural (albédo + normal + rugosité), mémoïsé et
 * libéré au démontage. La génération vit dans `createLawnTextures` (lib pure) —
 * partagée avec le splatting du terrain unifié.
 */
export function useLawnTexture(repeat: number): LawnTextures {
  const pack = useMemo(() => createLawnTextures(repeat), [repeat])

  useEffect(
    () => () => {
      pack.colorMap.dispose()
      pack.normalMap.dispose()
      pack.roughnessMap.dispose()
    },
    [pack],
  )

  return pack
}
