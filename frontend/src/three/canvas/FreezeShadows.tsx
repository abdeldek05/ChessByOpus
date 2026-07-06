import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

interface FreezeShadowsProps {
  /** Nombre de frames pendant lesquelles la shadow map est mise à jour. */
  frames?: number
}

/**
 * Rend les ombres pendant quelques frames (le temps que les modèles chargés
 * soient posés), puis fige la shadow map : la scène étant quasi statique, on
 * évite de recalculer les ombres à chaque frame — gros gain de FPS.
 */
export function FreezeShadows({ frames = 6 }: FreezeShadowsProps) {
  const { gl } = useThree()
  const count = useRef(0)

  useFrame(() => {
    if (count.current < frames) {
      gl.shadowMap.needsUpdate = true
      count.current += 1
    }
  })

  return null
}
