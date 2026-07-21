import { useEffect, useRef, useState } from 'react'
import {
  LOADING_MIN_DURATION_SEC,
  LOADING_MESSAGES,
  LOADING_MESSAGE_INTERVAL_SEC,
} from '@/constants/loadingScreen'

interface UseSceneLoadingOverlayResult {
  /** Progression cosmétique 0→1 sur LOADING_MIN_DURATION_SEC (jamais liée au vrai chargement). */
  progress: number
  /** Message courant, tourne toutes les LOADING_MESSAGE_INTERVAL_SEC. */
  message: string
  /** true tant que l'overlay doit rester affiché (scène pas prête OU durée min pas écoulée). */
  visible: boolean
  /** À appeler quand la scène 3D signale qu'elle a fini de monter (voir SceneReadySignal). */
  reportSceneReady: () => void
}

/**
 * Pilote l'écran de chargement affiché au montage de la scène de lancement :
 * une progression et un défilé de messages purement COSMÉTIQUES (temporisés,
 * pas de vrai pourcentage backend), maintenus au moins LOADING_MIN_DURATION_SEC
 * pour ne jamais flasher en une fraction de seconde — et prolongés au-delà si
 * la scène 3D (GLB, HDRI) n'a pas fini de monter à l'échéance.
 */
export function useSceneLoadingOverlay(): UseSceneLoadingOverlayResult {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [sceneReady, setSceneReady] = useState(false)
  const [minDurationElapsed, setMinDurationElapsed] = useState(false)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    let frameId: number
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const elapsedSec = (t - startRef.current) / 1000

      setProgress(Math.min(1, elapsedSec / LOADING_MIN_DURATION_SEC))
      setMessageIndex(Math.min(
        LOADING_MESSAGES.length - 1,
        Math.floor(elapsedSec / LOADING_MESSAGE_INTERVAL_SEC),
      ))

      if (elapsedSec >= LOADING_MIN_DURATION_SEC) {
        setMinDurationElapsed(true)
        return
      }
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return {
    progress,
    message: LOADING_MESSAGES[messageIndex],
    visible: !sceneReady || !minDurationElapsed,
    reportSceneReady: () => setSceneReady(true),
  }
}
