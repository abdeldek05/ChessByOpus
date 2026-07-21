import { useEffect } from 'react'

interface SceneReadySignalProps {
  /** Appelé UNE fois, quand ce composant monte réellement — c'est-à-dire quand
   *  le <Suspense> parent a fini de résoudre (GLB radars/mésange chargés). */
  onReady: () => void
}

/**
 * Sentinelle sans rendu : placée comme enfant du <Suspense> qui englobe les
 * modèles GLTF du pas de tir (voir LaunchSceneCanvas). React ne monte un enfant
 * de Suspense — et ne déclenche donc son effect — qu'UNE FOIS la suspension
 * levée, ce qui donne un signal "scène chargée" fiable, sans deviner une durée.
 */
export function SceneReadySignal({ onReady }: SceneReadySignalProps) {
  useEffect(() => {
    onReady()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signal ponctuel au montage, jamais re-déclenché
  }, [])

  return null
}
