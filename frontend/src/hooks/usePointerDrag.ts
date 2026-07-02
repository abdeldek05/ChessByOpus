import { useCallback, useEffect, useRef } from 'react'

interface Anchor {
  x: number
  y: number
}

interface UsePointerDragResult {
  ref: React.RefObject<SVGSVGElement | null>
  onPointerDown: (event: React.PointerEvent) => void
}

const CENTER: Anchor = { x: 0.5, y: 0.5 }

/**
 * Suivi de glissement au-dessus d'un SVG : renvoie le décalage (dx, dy) du
 * pointeur par rapport à un point d'ancrage (fractions 0-1 de l'élément). Les
 * widgets (boussole, pas de tir) en déduisent leur angle.
 */
export function usePointerDrag(
  onMove: (dx: number, dy: number) => void,
  anchor: Anchor = CENTER,
): UsePointerDragResult {
  const ref = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const moveRef = useRef(onMove)
  moveRef.current = onMove
  const anchorRef = useRef(anchor)
  anchorRef.current = anchor

  const emit = useCallback((clientX: number, clientY: number) => {
    const element = ref.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const pivotX = rect.left + rect.width * anchorRef.current.x
    const pivotY = rect.top + rect.height * anchorRef.current.y
    moveRef.current(clientX - pivotX, clientY - pivotY)
  }, [])

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      dragging.current = true
      emit(event.clientX, event.clientY)
    },
    [emit],
  )

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (dragging.current) emit(event.clientX, event.clientY)
    }
    const stop = () => {
      dragging.current = false
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', stop)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', stop)
    }
  }, [emit])

  return { ref, onPointerDown }
}
