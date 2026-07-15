import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

interface FreezeShadowsProps {
  /** Nombre de frames pendant lesquelles la shadow map est mise à jour. */
  frames?: number
  /** Change de valeur (ex. bascule jour/nuit) → les ombres sont recalculées. */
  resetKey?: string | number
}

/**
 * Rend les ombres pendant quelques frames (le temps que les modèles chargés
 * soient posés), puis fige la shadow map : la scène étant quasi statique, on
 * évite de recalculer les ombres à chaque frame — gros gain de FPS. Quand
 * `resetKey` change (ex. bascule jour/nuit → autre lumière), le compteur
 * repart : les ombres sont recalculées pour la nouvelle ambiance puis refigées.
 */
export function FreezeShadows({ frames = 6, resetKey }: FreezeShadowsProps) {
  const count = useRef(0)

  useEffect(() => {
    count.current = 0
  }, [resetKey])

  useFrame(({ gl }) => {
    if (count.current < frames) {
      gl.shadowMap.needsUpdate = true
      count.current += 1
    }
  })

  return null
}
