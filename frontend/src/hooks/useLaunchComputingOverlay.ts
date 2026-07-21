import { useEffect, useRef, useState } from 'react'
import {
  COMPUTING_MESSAGES,
  COMPUTING_PROGRESS_CEILING,
  COMPUTING_PROGRESS_TAU,
  LOADING_MESSAGE_INTERVAL_SEC,
} from '@/constants/loadingScreen'

interface UseLaunchComputingOverlayParams {
  /** true quand le décompte est fini mais le vol n'a pas encore démarré
   *  (phase === 'countdown' && countdown <= 0) — voir LaunchHud. */
  active: boolean
}

interface UseLaunchComputingOverlayResult {
  /** Progression cosmétique 0→CEILING pendant l'attente, 1 une fois active retombé à false. */
  progress: number
  /** Message de calcul courant, tourne toutes les LOADING_MESSAGE_INTERVAL_SEC. */
  message: string
}

/**
 * Pilote l'overlay de calcul de tir affiché APRÈS le décompte 3-2-1, le temps
 * que RocketPy réponde. La barre monte en asymptote vers COMPUTING_PROGRESS_
 * CEILING (jamais 100 % figé tant que ça calcule) et les messages défilent ;
 * l'overlay disparaît dès que `active` repasse à false (vol démarré ou échec),
 * piloté par la VRAIE fin du backend, pas par une durée devinée.
 */
export function useLaunchComputingOverlay({
  active,
}: UseLaunchComputingOverlayParams): UseLaunchComputingOverlayResult {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) {
      startRef.current = null
      setProgress(0)
      setMessageIndex(0)
      return
    }

    let frameId: number
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const elapsedSec = (t - startRef.current) / 1000

      // Approche asymptotique du plafond : rapide au début, ralentit près du
      // plafond — donne l'impression d'un vrai calcul qui « finalise ».
      setProgress(COMPUTING_PROGRESS_CEILING * (1 - Math.exp(-elapsedSec / COMPUTING_PROGRESS_TAU)))
      setMessageIndex(Math.floor(elapsedSec / LOADING_MESSAGE_INTERVAL_SEC) % COMPUTING_MESSAGES.length)

      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [active])

  return {
    progress,
    message: COMPUTING_MESSAGES[messageIndex],
  }
}
