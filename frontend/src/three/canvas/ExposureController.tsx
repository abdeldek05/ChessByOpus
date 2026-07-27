import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { DAYLIGHT_EXPOSURE } from '@/three/constants/launchDaylight'
import { NIGHT_EXPOSURE } from '@/three/constants/launchNight'
import type { SceneMode } from '@/types/scene.types'

interface ExposureControllerProps {
  /** Ambiance courante : jour (exposition golden hour) ou nuit (abaissée). */
  mode: SceneMode
}

/**
 * Applique l'exposition du tone mapping selon l'ambiance. L'exposition passée
 * à `<Canvas gl={{ toneMappingExposure }}>` n'est lue qu'à la CRÉATION du
 * renderer : la bascule ☀/☾ ne la changerait pas. Ce petit contrôleur, monté
 * dans le Canvas (accès à `gl` via useThree), l'ajuste à chaque changement de
 * `mode` — c'est ce qui rend la scène plus sombre la nuit.
 */
export function ExposureController({ mode }: ExposureControllerProps) {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    gl.toneMappingExposure = mode === 'night' ? NIGHT_EXPOSURE : DAYLIGHT_EXPOSURE
  }, [gl, mode])

  return null
}
