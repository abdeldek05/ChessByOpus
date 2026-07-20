import { useCallback, useEffect, useRef, useState } from 'react'
import type * as THREE from 'three'

/** Délai laissé au navigateur pour restaurer le contexte avant remontage forcé. */
const RESTORE_GRACE_MS = 1500

interface CanvasRecovery {
  /** Clé de remontage : change → le <Canvas> est recréé avec un contexte neuf. */
  remountKey: number
  /** Vrai entre la perte du contexte et sa récupération (affiche l'overlay). */
  lost: boolean
  /** À passer au <Canvas> (via onGlReady) pour brancher l'écoute perte/restauration. */
  registerGl: (gl: THREE.WebGLRenderer) => void
}

/**
 * Rend le canvas 3D résilient à la perte du contexte WebGL (driver GPU qui reset,
 * ou navigateur qui tue le plus ancien contexte quand la limite ~8-16 est atteinte).
 *
 * Sans ça, un `webglcontextlost` laisse le canvas BLANC pour toujours. Ici :
 * 1. on `preventDefault()` la perte → on demande au navigateur de restaurer ;
 * 2. si `webglcontextrestored` arrive à temps, Three réinitialise seul, overlay masqué ;
 * 3. sinon (contexte définitivement perdu), on remonte le <Canvas> avec une nouvelle
 *    clé → contexte tout neuf, plutôt qu'un écran figé.
 */
export function useCanvasRecovery(): CanvasRecovery {
  const [remountKey, setRemountKey] = useState(0)
  const [lost, setLost] = useState(false)
  const graceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearGrace = useCallback(() => {
    if (graceTimer.current) {
      clearTimeout(graceTimer.current)
      graceTimer.current = null
    }
  }, [])

  const registerGl = useCallback(
    (gl: THREE.WebGLRenderer) => {
      const canvas = gl.domElement

      const onLost = (event: Event) => {
        // Indispensable : sans preventDefault, le navigateur n'émet JAMAIS
        // webglcontextrestored et la perte devient définitive.
        event.preventDefault()
        setLost(true)
        clearGrace()
        graceTimer.current = setTimeout(() => setRemountKey((k) => k + 1), RESTORE_GRACE_MS)
      }

      const onRestored = () => {
        clearGrace()
        setLost(false)
      }

      canvas.addEventListener('webglcontextlost', onLost, false)
      canvas.addEventListener('webglcontextrestored', onRestored, false)
      // Les écouteurs disparaissent avec l'élément canvas (démontage / remontage) :
      // aucune fuite, pas de cleanup manuel nécessaire ici.
    },
    [clearGrace],
  )

  // Après un remontage, on repart d'un état sain.
  useEffect(() => {
    setLost(false)
    clearGrace()
  }, [remountKey, clearGrace])

  useEffect(() => clearGrace, [clearGrace])

  return { remountKey, lost, registerGl }
}
