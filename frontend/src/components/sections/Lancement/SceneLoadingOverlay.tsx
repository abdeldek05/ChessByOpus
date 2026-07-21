import { RocketIcon } from './RocketIcon'

interface SceneLoadingOverlayProps {
  /** Progression cosmétique 0→1 (voir useSceneLoadingOverlay) — pas un vrai pourcentage backend. */
  progress: number
  /** Message courant, tourne pendant le chargement. */
  message: string
  /** Titre affiché au-dessus de la piste. */
  title?: string
  /** Fond assombri translucide au lieu d'opaque : laisse voir la scène derrière
   *  (utilisé pendant le calcul de tir, où la rampe reste visible). */
  dimmed?: boolean
}

/**
 * Écran de chargement (fusée glissant vers une icône radar, texte de statut en
 * rotation) : sert au montage de la scène 3D (fond opaque, voir
 * useSceneLoadingOverlay) ET à l'attente du calcul de tir (fond translucide,
 * voir LaunchComputingOverlay). Rendu pur — la logique de progression/timing
 * vit dans les hooks appelants.
 */
export function SceneLoadingOverlay({
  progress,
  message,
  title = 'Preparing launch scene',
  dimmed = false,
}: SceneLoadingOverlayProps) {
  // Position de la pastille le long de la piste : calculée dynamiquement selon
  // la progression courante — seule exception au style inline (voir CLAUDE.md).
  const markerLeft = `${progress * 100}%`

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 font-mono ${
        dimmed ? 'bg-bg/80 backdrop-blur-sm' : 'bg-bg'
      }`}
    >
      <p className="font-fine text-xs font-light tracking-[0.4em] text-accent-bright uppercase">
        {title}
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
