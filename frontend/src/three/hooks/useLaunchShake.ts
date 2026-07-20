import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  LAUNCH_SHAKE_AMPLITUDE,
  LAUNCH_SHAKE_DURATION_SEC,
  LAUNCH_SHAKE_FREQUENCY,
} from '@/three/constants/flightPlayback'

interface UseLaunchShakeParams {
  /** Vol en cours : le flanc montant (false → true) déclenche la secousse. */
  flying: boolean
}

/**
 * Secousse caméra brève au décollage (simule la poussée qui ébranle le sol) :
 * un décalage sinusoïdal amorti appliqué APRÈS le calcul normal de la caméra
 * (donc ce hook doit être appelé après `useOrbitTargetFollow` pour s'exécuter
 * plus tard dans la boucle `useFrame`, sans être écrasé). N'affecte jamais la
 * cible des contrôles, seulement la position caméra — le shake ne dérive donc
 * jamais le cadrage une fois terminé.
 */
// Désynchronise l'axe Y de l'axe X (fréquence + phase différentes, amplitude
// réduite) pour un tremblement moins mécanique qu'une simple oscillation 2D.
const Y_FREQUENCY_RATIO = 1.3
const Y_PHASE_OFFSET = 1.7
const Y_AMPLITUDE_RATIO = 0.6

export function useLaunchShake({ flying }: UseLaunchShakeParams) {
  const wasFlying = useRef(false)
  const shakeElapsed = useRef(Infinity) // Infinity = pas de secousse active.

  useEffect(() => {
    if (flying && !wasFlying.current) {
      shakeElapsed.current = 0
    }
    wasFlying.current = flying
  }, [flying])

  useFrame(({ camera }, delta) => {
    if (shakeElapsed.current >= LAUNCH_SHAKE_DURATION_SEC) return

    shakeElapsed.current += delta
    const progress = Math.min(1, shakeElapsed.current / LAUNCH_SHAKE_DURATION_SEC)
    // Décroissance quadratique : fort au tout début, s'éteint vite (pas un
    // bruit qui traîne).
    const falloff = (1 - progress) ** 2
    const t = shakeElapsed.current
    const dx = Math.sin(t * LAUNCH_SHAKE_FREQUENCY) * LAUNCH_SHAKE_AMPLITUDE * falloff
    const dy =
      Math.sin(t * LAUNCH_SHAKE_FREQUENCY * Y_FREQUENCY_RATIO + Y_PHASE_OFFSET) *
      LAUNCH_SHAKE_AMPLITUDE *
      falloff *
      Y_AMPLITUDE_RATIO
    camera.position.x += dx
    camera.position.y += dy
  })
}
