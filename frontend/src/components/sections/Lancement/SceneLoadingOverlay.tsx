import { RocketIcon } from './RocketIcon'

interface SceneLoadingOverlayProps {
  /** Progression cosmétique 0→1 (voir useSceneLoadingOverlay) — pas un vrai pourcentage backend. */
  progress: number
  /** Message courant, tourne pendant le chargement. */
  message: string
}

/**
 * Écran de chargement plein écran affiché le temps que la scène 3D de
 * lancement monte (GLB, HDRI, terrain) : une pastille fusée glisse le long
 * d'une piste vers une icône radar, texte de statut en rotation en dessous.
 * Rendu pur — toute la logique de progression/timing vit dans
 * useSceneLoadingOverlay.
 */
export function SceneLoadingOverlay({ progress, message }: SceneLoadingOverlayProps) {
  // Position de la pastille le long de la piste : calculée dynamiquement selon
  // la progression courante — seule exception au style inline (voir CLAUDE.md).
  const markerLeft = `${progress * 100}%`

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-bg font-mono">
      <p className="font-fine text-xs font-light tracking-[0.4em] text-accent-bright uppercase">
        Preparing launch scene
      </p>

      <div className="flex w-full max-w-md items-center gap-4 px-10">
        <span className="text-lg text-accent-bright">◈</span>
        <div className="loading-track relative h-px flex-1">
          <div
            className="loading-track__fill absolute inset-y-0 left-0"
            style={{ width: markerLeft }}
          />
          <RocketIcon
            className="loading-marker-glow absolute top-1/2 size-5 -translate-y-1/2 -translate-x-1/2 text-accent-bright"
            style={{ left: markerLeft }}
          />
        </div>
        <span className="text-lg text-accent-bright">▨</span>
      </div>

      <p className="text-[11px] tracking-[0.24em] text-ink-dim uppercase">{message}</p>
    </div>
  )
}
