import type { CoverageProfileLive } from '@/hooks/useCoverageProfileLive'
import type { RadarCut } from '@/hooks/useCoverageCut'

interface CoverageLiveBarProps {
  live: CoverageProfileLive
  radarCuts: RadarCut[]
}

/**
 * Bandeau LIVE du profil : état de la menace à l'instant courant du vol —
 * temps, altitude, distance sol, et statut de visibilité (VU par quel(s)
 * radar(s), ou ANGLE MORT). Alimenté par useCoverageProfileLive (throttlé).
 * Hors vol (index < 0) : invite à lancer. Pastilles couleur = radars qui
 * voient à cet instant, même code couleur que le graphe.
 */
export function CoverageLiveBar({ live, radarCuts }: CoverageLiveBarProps) {
  const flying = live.index >= 0
  const seen = radarCuts.filter((rc) => live.seenBy.includes(rc.id))

  return (
    <div className="hud-inset flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-accent-bright/15 px-4 py-2 font-mono">
      {!flying ? (
        <span className="type-label-tight text-ink-faint">Awaiting flight…</span>
      ) : (
        <>
          <span className="text-xs text-accent-bright">T+{Math.round(live.tSec)}s</span>
          <span className="font-mono text-label text-ink">alt {(live.altM / 1000).toFixed(1)} km</span>
          <span className="font-mono text-label text-ink">dist {(live.distM / 1000).toFixed(1)} km</span>
          {seen.length > 0 ? (
            <span className="flex items-center gap-1.5 text-label font-bold tracking-hud">
              {seen.map((rc) => (
                <span key={rc.id} className="flex items-center gap-1" style={{ color: rc.color }}>
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: rc.color }} />
                  SEEN · {rc.name}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-label font-bold tracking-hud text-ink-faint">◌ BLIND SPOT</span>
          )}
        </>
      )}
    </div>
  )
}
