import { useEffect, useRef } from 'react'

const STRENGTH = 0.35
const MAX_OFFSET_PX = 14

/**
 * Fait légèrement "suivre" le curseur à un élément (effet bouton
 * magnétique), avec un retour au centre au survol sortant. Manipule le
 * style directement (pas de re-render React) pour rester fluide à 60fps.
 */
export function useMagneticHover<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handlePointerMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const offsetX = event.clientX - (rect.left + rect.width / 2)
      const offsetY = event.clientY - (rect.top + rect.height / 2)
      const x = Math.max(-MAX_OFFSET_PX, Math.min(MAX_OFFSET_PX, offsetX * STRENGTH))
      const y = Math.max(-MAX_OFFSET_PX, Math.min(MAX_OFFSET_PX, offsetY * STRENGTH))
      el.style.transform = `translate(${x}px, ${y}px)`
    }

    const handlePointerLeave = () => {
      el.style.transform = 'translate(0, 0)'
    }

    el.addEventListener('pointermove', handlePointerMove)
    el.addEventListener('pointerleave', handlePointerLeave)
    return () => {
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return ref
}
