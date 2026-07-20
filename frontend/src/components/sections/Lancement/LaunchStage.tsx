import { LaunchSceneCanvas, type LaunchSceneCanvasProps } from '@/three/canvas/LaunchSceneCanvas'
import { useCanvasRecovery } from '@/three/hooks/useCanvasRecovery'
import { ContextLostOverlay } from './ContextLostOverlay'

type LaunchStageProps = Omit<LaunchSceneCanvasProps, 'onGlReady'>

/**
 * Enveloppe résiliente du canvas 3D de lancement : gère la perte / restauration
 * du contexte WebGL (useCanvasRecovery) et remonte le <Canvas> avec un contexte
 * neuf plutôt que de laisser un écran blanc. Le reste (scène, HUD, carte) reste
 * dans Lancement — ce composant n'ajoute QUE la couche de résilience GPU.
 */
export function LaunchStage(props: LaunchStageProps) {
  const { remountKey, lost, registerGl } = useCanvasRecovery()

  return (
    <>
      <LaunchSceneCanvas key={remountKey} {...props} onGlReady={registerGl} />
      {lost && <ContextLostOverlay />}
    </>
  )
}
