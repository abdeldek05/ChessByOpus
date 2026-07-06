import { useCallback, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'

interface UseLaunchButtonParams {
  enabled: boolean
  onLaunch: () => void
}

interface UseLaunchButtonResult {
  hovered: boolean
  pressed: boolean
  handlers: {
    onPointerOver: (event: ThreeEvent<PointerEvent>) => void
    onPointerOut: (event: ThreeEvent<PointerEvent>) => void
    onPointerDown: (event: ThreeEvent<PointerEvent>) => void
    onPointerUp: (event: ThreeEvent<PointerEvent>) => void
  }
}

/**
 * État d'interaction du bouton LANCER en 3D : survol (curseur pointer + lueur),
 * enfoncement, et déclenchement au relâché. Ne fait rien si `enabled` est faux
 * (scénario non lançable) — le bouton reste verrouillé et non cliquable.
 */
export function useLaunchButton({ enabled, onLaunch }: UseLaunchButtonParams): UseLaunchButtonResult {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const onPointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!enabled) return
      event.stopPropagation()
      setHovered(true)
      document.body.style.cursor = 'pointer'
    },
    [enabled],
  )

  const onPointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setHovered(false)
    setPressed(false)
    document.body.style.cursor = 'auto'
  }, [])

  const onPointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!enabled) return
      event.stopPropagation()
      setPressed(true)
    },
    [enabled],
  )

  const onPointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!enabled) return
      event.stopPropagation()
      setPressed(false)
      onLaunch()
    },
    [enabled, onLaunch],
  )

  return {
    hovered,
    pressed,
    handlers: { onPointerOver, onPointerOut, onPointerDown, onPointerUp },
  }
}
