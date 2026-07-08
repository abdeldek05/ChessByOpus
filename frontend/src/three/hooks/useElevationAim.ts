import { useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { INCLINATION_MIN_DEG, INCLINATION_MAX_DEG } from '@/three/constants/inclinationScene'

interface UseElevationAimResult {
  handlers: {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => void
    onPointerMove: (event: ThreeEvent<PointerEvent>) => void
    onPointerUp: (event: ThreeEvent<PointerEvent>) => void
  }
}

/**
 * Saisir la fusée et la faire pivoter : le point 3D touché (raycast R3F sur le
 * plan de rotation) est converti en angle autour du pivot (la base, à
 * l'origine) — le geste correspond exactement à la rotation, au dixième de
 * degré, borné 70–90°. Le pointeur est capturé pendant le glisser.
 */
export function useElevationAim(onChange: (deg: number) => void): UseElevationAimResult {
  const dragging = useRef(false)
  const changeRef = useRef(onChange)
  changeRef.current = onChange

  const emit = (event: ThreeEvent<PointerEvent>) => {
    // Pivot à l'origine : l'angle depuis la verticale (+Y) donne l'élévation.
    const fromVerticalDeg = (Math.atan2(event.point.x, event.point.y) * 180) / Math.PI
    const deg = Math.min(INCLINATION_MAX_DEG, Math.max(INCLINATION_MIN_DEG, 90 - fromVerticalDeg))
    changeRef.current(Math.round(deg * 10) / 10)
  }

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    dragging.current = true
    ;(event.target as Element).setPointerCapture?.(event.pointerId)
    emit(event)
  }
  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (dragging.current) emit(event)
  }
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    dragging.current = false
    ;(event.target as Element).releasePointerCapture?.(event.pointerId)
  }

  return { handlers: { onPointerDown, onPointerMove, onPointerUp } }
}
