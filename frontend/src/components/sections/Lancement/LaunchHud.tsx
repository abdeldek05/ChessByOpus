import type { LaunchPhase } from '@/hooks/useLaunchSequence'

interface LaunchHudProps {
  siteName: string
  radarName: string
  phase: LaunchPhase
  countdown: number
  /** Déclenche la séquence de lancement (bouton LANCER). */
  onLaunch: () => void
  onReplay: () => void
}

const CLIP = 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)'
const CLIP_BTN = 'polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)'

/**
 * Surcouche minimale de la scène : identité mission (haut-droite), grand bouton
 * LANCER (armé), compte à rebours plein écran, puis bouton REJOUER. Le bouton
 * LANCER est un vrai bouton 2D (pas la console 3D). Style HUD angulaire.
 */
export function LaunchHud({ siteName, radarName, phase, countdown, onLaunch, onReplay }: LaunchHudProps) {
  const finished = phase === 'done' || phase === 'error'
  const running = phase === 'running'
  const armed = phase === 'armed'

  return (
    <div className="pointer-events-none absolute inset-0 font-mono">
      {/* Identité mission */}
      <div className="absolute top-6 right-6 space-y-1 text-right">
        <p className="text-[11px] tracking-[0.2em] text-ink-dim uppercase">{siteName}</p>
        <p className="text-xs text-ink">{radarName}</p>
      </div>

      {/* Grand bouton LANCER (phase armée) */}
      {armed && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={onLaunch}
            className="group pointer-events-auto flex items-center gap-3 border-2 border-warning/60 bg-warning/10 px-10 py-4 text-lg font-bold tracking-[0.32em] text-warning uppercase shadow-[0_0_40px_rgba(217,138,61,0.35)] transition-all hover:bg-warning/25 hover:shadow-[0_0_60px_rgba(217,138,61,0.6)]"
            style={{ clipPath: CLIP_BTN }}
          >
            <span className="h-3 w-3 animate-pulse rounded-full bg-warning" />
            LAUNCH
          </button>
        </div>
      )}

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
          <span className="text-xs tracking-[0.24em] text-accent-bright uppercase">Simulation in progress</span>
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
            ⟳ REPLAY
          </button>
        </div>
      )}
    </div>
  )
}
