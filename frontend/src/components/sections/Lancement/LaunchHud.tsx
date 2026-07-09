import type { LaunchPhase } from '@/hooks/useLaunchSequence'

interface LaunchHudProps {
  siteName: string
  radarName: string
  phase: LaunchPhase
  countdown: number
  onReplay: () => void
}

const CLIP = 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)'

/**
 * Surcouche minimale de la scène : identité mission (haut-droite) et grand
 * compte à rebours plein écran au lancement. Bouton REJOUER une fois la
 * séquence terminée. Plus de bandeau de statut bavard.
 */
export function LaunchHud({ siteName, radarName, phase, countdown, onReplay }: LaunchHudProps) {
  const finished = phase === 'done' || phase === 'error'
  const running = phase === 'igniting' || phase === 'running'

  return (
    <div className="pointer-events-none absolute inset-0 font-mono">
      {/* Identité mission */}
      <div className="absolute top-6 right-6 space-y-1 text-right">
        <p className="text-[11px] tracking-[0.2em] text-ink-dim uppercase">{siteName}</p>
        <p className="text-xs text-ink">{radarName}</p>
      </div>

      {/* Compte à rebours plein écran */}
      {phase === 'countdown' && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13rem] leading-none font-bold text-warning drop-shadow-[0_0_50px_rgba(217,138,61,0.6)]">
            {countdown}
          </span>
        </div>
      )}

      {/* Indicateur simulation en cours */}
      {running && (
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3">
          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-accent-bright" />
          <span className="text-xs tracking-[0.24em] text-accent-bright uppercase">Simulation en cours</span>
        </div>
      )}

      {/* Bouton rejouer */}
      {finished && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={onReplay}
            className="pointer-events-auto flex items-center gap-2 border border-accent-bright/40 bg-accent-bright/10 py-2.5 pr-5 pl-4 text-[10px] font-bold tracking-[0.24em] text-accent-bright transition-colors hover:bg-accent-bright/20"
            style={{ clipPath: CLIP }}
          >
            ⟳ REJOUER
          </button>
        </div>
      )}
    </div>
  )
}
