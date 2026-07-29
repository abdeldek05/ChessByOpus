import type { RadarCut } from '@/hooks/useCoverageCut'

interface CoverageWindowsSummaryProps {
  radarCuts: RadarCut[]
  /** Index de trajectoire courant (live) : -1 = vol fini/hors vol → récap
   *  COMPLET. Pendant le vol : seules les fenêtres déjà atteintes comptent, et
   *  une fenêtre en cours affiche « en poursuite ». */
  liveIndex: number
}

/** Distance sol (km) au point de première visibilité d'une fenêtre. */
function acqKm(sInM: number): string {
  return (Math.abs(sInM) / 1000).toFixed(1)
}

/**
 * Récapitulatif par radar des fenêtres de visibilité, sous le graphe — la
 * donnée exploitable sans lire le graphe (exigence Thales). SE REMPLIT AU FIL
 * DU VOL (liveIndex) : « acquis T+… @ … km » dès l'entrée, « → perdu T+… » dès
 * la sortie, « en poursuite » tant que la fenêtre courante n'est pas finie.
 * Vol terminé (liveIndex < 0) : récap complet (acquis → perdu + durée cumulée).
 */
export function CoverageWindowsSummary({ radarCuts, liveIndex }: CoverageWindowsSummaryProps) {
  if (radarCuts.length === 0) return null
  const finished = liveIndex < 0

  return (
    <div className="hud-inset shrink-0 space-y-0.5 border-t border-accent-bright/15 px-3 py-1.5 font-mono">
      {radarCuts.map((rc) => {
        // Fenêtres déjà entamées à l'instant courant (ou toutes si vol fini).
        const reached = rc.windows.filter((w) => finished || w.iIn <= liveIndex)
        const first = reached[0]
        const last = reached[reached.length - 1]
        // Fenêtre encore en cours (entrée atteinte, sortie pas encore) ?
        const ongoing = !finished && last && liveIndex <= last.iOut
        const totalSec = reached.reduce((sum, w) => sum + w.durationSec, 0)

        return (
          <div key={rc.id} className="flex items-center gap-2 text-micro leading-tight tracking-hud">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: rc.color }} />
            <span className="shrink-0 text-ink-dim uppercase">{rc.name}</span>
            {!first ? (
              <span className="text-ink-faint">{finished ? 'never in sight' : '—'}</span>
            ) : ongoing ? (
              <span style={{ color: rc.color }}>
                acquired T+{Math.round(first.tIn)}s @ {acqKm(first.sInM)} km<span className="text-ink-faint"> · tracking…</span>
              </span>
            ) : (
              <span className="text-ink">
                acquired T+{Math.round(first.tIn)}s @ {acqKm(first.sInM)} km → lost T+{Math.round(last.tOut)}s
                <span className="text-ink-faint"> · {Math.round(totalSec)}s total</span>
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
