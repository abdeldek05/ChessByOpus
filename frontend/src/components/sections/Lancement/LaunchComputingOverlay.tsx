import { SceneLoadingOverlay } from './SceneLoadingOverlay'
import { useLaunchComputingOverlay } from '@/hooks/useLaunchComputingOverlay'

interface LaunchComputingOverlayProps {
  /** Décompte terminé, vol pas encore démarré (backend calcule) — voir LaunchHud. */
  active: boolean
}

/**
 * Overlay de calcul de tir affiché après le décompte 3-2-1, le temps que
 * RocketPy réponde : réutilise la barre fusée→radar (SceneLoadingOverlay) en
 * fond TRANSLUCIDE (la rampe reste visible derrière) plutôt que le gros « GO »
 * figé qui traînait à l'écran. Disparaît dès que le vol démarre (active=false).
 */
export function LaunchComputingOverlay({ active }: LaunchComputingOverlayProps) {
  const { progress, message } = useLaunchComputingOverlay({ active })
  if (!active) return null
  return <SceneLoadingOverlay progress={progress} message={message} title="Launching" dimmed />
}
