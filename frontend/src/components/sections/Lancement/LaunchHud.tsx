import type { LaunchPhase } from '@/hooks/useLaunchSequence'

interface LaunchHudProps {
  siteName: string
  radarName: string
  distance: string
  phase: LaunchPhase
  countdown: number
  message: string
  onReplay: () => void
}

const PHASE_STATUS: Record<LaunchPhase, { tag: string; tint: string; dot: string }> = {
  armed: { tag: 'EN ATTENTE', tint: 'text-accent-bright', dot: 'bg-accent-bright' },
  countdown: { tag: 'DÉCOMPTE', tint: 'text-warning', dot: 'bg-warning' },
  igniting: { tag: 'ALLUMAGE', tint: 'text-warning', dot: 'bg-warning' },
  flight: { tag: 'MENACE EN VOL', tint: 'text-warning', dot: 'bg-warning' },
  running: { tag: 'ANALYSE', tint: 'text-accent-bright', dot: 'bg-accent-bright' },
  done: { tag: 'MISSION CLOSE', tint: 'text-success', dot: 'bg-success' },
  error: { tag: 'ANOMALIE', tint: 'text-danger', dot: 'bg-danger' },
}

const CLIP = 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)'

/**
 * Surcouche de la scène : identité mission (haut-droite), grand compte à rebours
 * plein écran, jauge de statut en bas, et bouton REJOUER une fois la mission
 * close ou en anomalie.
 */
export function LaunchHud({ siteName, radarName, distance, phase, countdown, message, onReplay }: LaunchHudProps) {
  const status = PHASE_STATUS[phase]
  const armed = phase === 'armed'
  const finished = phase === 'done' || phase === 'error'

  return (
    <div className="pointer-events-none absolute inset-0 font-mono">
      {/* Identité mission (à droite, la télémétrie prend la gauche) */}
      <div className="absolute top-6 right-6 space-y-1 text-right">
        <p className="text-[11px] tracking-[0.2em] text-ink-dim uppercase">{siteName}</p>
        <p className="text-xs text-ink">
          {radarName} · {distance} du pas de tir
        </p>
      </div>

      {/* Compte à rebours plein écran */}
      {phase === 'countdown' && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13rem] leading-none font-bold text-warning drop-shadow-[0_0_50px_rgba(217,138,61,0.6)]">
            {countdown}
          </span>
        </div>
      )}

      {/* Statut bas + bouton rejouer */}
      <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-3">
        <div
          className="flex items-center gap-3 border border-white/10 bg-black/55 py-2.5 pr-6 pl-4"
          style={{ clipPath: CLIP }}
        >
          <span className={`relative inline-flex h-2.5 w-2.5 ${status.dot} rounded-full`}>
            {armed && (
              <span className={`absolute inset-0 ${status.dot} animate-ping rounded-full opacity-75`} />
            )}
          </span>
          <span className={`text-[10px] font-bold tracking-[0.28em] ${status.tint}`}>{status.tag}</span>
          <span className="h-3 w-px bg-white/15" />
          <span className="text-xs tracking-wide text-ink-dim">{message}</span>
        </div>

        {finished && (
          <button
            type="button"
            onClick={onReplay}
            className="pointer-events-auto flex items-center gap-2 border border-accent-bright/40 bg-accent-bright/10 py-2.5 pr-5 pl-4 text-[10px] font-bold tracking-[0.24em] text-accent-bright transition-colors hover:bg-accent-bright/20"
            style={{ clipPath: CLIP }}
          >
            ⟳ REJOUER
          </button>
        )}
      </div>
    </div>
  )
}
