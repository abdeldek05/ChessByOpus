import type { LaunchPhase } from '@/hooks/useLaunchSequence'

interface LaunchHudProps {
  siteName: string
  radarName: string
  phase: LaunchPhase
  countdown: number
  /** Message d'état / d'erreur de la séquence — affiché quand la simu échoue. */
  message: string
  /** Déclenche la séquence de lancement (bouton LANCER). */
  onLaunch: () => void
  onReplay: () => void
  /** Ouvre la page analytics post-simulation (absent tant qu'aucun vol). */
  onAnalytics?: () => void
}

/**
 * Surcouche minimale de la scène : identité mission (haut-droite), grand bouton
 * LANCER (armé), compte à rebours plein écran, puis bouton REJOUER. Le bouton
 * LANCER est un vrai bouton 2D (pas la console 3D). Style HUD angulaire.
 */
export function LaunchHud({ siteName, radarName, phase, countdown, message, onLaunch, onReplay, onAnalytics }: LaunchHudProps) {
  const finished = phase === 'done' || phase === 'error'
  const running = phase === 'running'
  const armed = phase === 'armed'
  const failed = phase === 'error'

  return (
    <div className="pointer-events-none absolute inset-0 font-mono">
      {/* Identité mission */}
      <div className="absolute top-6 right-6 space-y-1 text-right">
        <p className="type-label text-ink-dim">{siteName}</p>
        <p className="text-xs text-ink">{radarName}</p>
      </div>

      {/* Grand bouton LANCER (phase armée) : le bouton le plus important de
          toute l'app — label d'état façon console au-dessus, indicateur
          « armé » en ping superposé (pas un simple point), glow à deux
          couches (voir index.css) et léger zoom au survol pour un vrai
          retour tactile. */}
      {armed && (
        <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5">
          <span className="type-eyebrow font-fine font-light text-warning/70">
            Systems armed
          </span>
          <button
            type="button"
            onClick={onLaunch}
            className="clip-corner-18 launch-btn-glow launch-btn-fill group pointer-events-auto flex items-center gap-3 border-2 border-warning/60 px-10 py-4 text-lg font-bold tracking-eyebrow text-warning uppercase transition-all duration-300 hover:scale-[1.03] hover:border-warning"
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-warning" />
            </span>
            LAUNCH
          </button>
        </div>
      )}

      {/* Compte à rebours plein écran (3-2-1 uniquement). Une fois à 0, ce bloc
          s'efface : l'overlay de calcul animé (LaunchComputingOverlay, monté
          dans LancementScene) prend le relais le temps que le backend réponde —
          plus de gros « GO » figé plaqué à l'écran pendant l'attente. */}
      {phase === 'countdown' && countdown > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="countdown-glow text-[13rem] leading-none font-bold text-warning">{countdown}</span>
        </div>
      )}

      {/* Indicateur simulation en cours */}
      {running && (
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3">
          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-accent-bright" />
          <span className="text-xs tracking-wide-hud text-accent-bright uppercase">Simulation in progress</span>
        </div>
      )}

      {/* Échec de simulation : message CLAIR (avant, l'erreur était muette — le
          panneau bilan étant désactivé — donc « ça ne se lance pas » sans
          explication). Le bouton REPLAY ci-dessous permet de réessayer. */}
      {failed && (
        <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-center">
          <p className="type-eyebrow font-fine font-light text-alert">
            Simulation failed
          </p>
          {message && <p className="max-w-xs text-label text-ink-dim">{message}</p>}
        </div>
      )}

      {/* Boutons de fin de simulation : rejouer + analytics. CONTRASTE
          ACCENTUÉ (avant : fond /10, bordure /40, texte 10px — trop discrets,
          se perdaient sur la scène) : fond plein teinté, bordure pleine, texte
          plus grand + glow HUD, léger zoom au survol. */}
      {finished && (
        <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="clip-corner-14 hud-btn-glow pointer-events-auto flex items-center gap-2 border-2 border-accent-bright bg-accent-bright/30 py-3 pr-6 pl-5 text-xs font-bold tracking-wide-hud text-accent-bright transition-all duration-200 hover:scale-[1.04] hover:bg-accent-bright/45"
          >
            ⟳ REPLAY
          </button>
          {onAnalytics && (
            <button
              type="button"
              onClick={onAnalytics}
              className="clip-corner-14 hud-btn-glow pointer-events-auto flex items-center gap-2 border-2 border-warning bg-warning/30 py-3 pr-6 pl-5 text-xs font-bold tracking-wide-hud text-warning transition-all duration-200 hover:scale-[1.04] hover:bg-warning/45"
            >
              ▤ ANALYTICS
            </button>
          )}
        </div>
      )}
    </div>
  )
}
