import 'maplibre-gl/dist/maplibre-gl.css'
import { useLaunchTacticalMap } from '@/hooks/useLaunchTacticalMap'
import { useMapExpansion } from '@/hooks/useMapExpansion'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

interface LaunchTacticalMapProps {
  site: LaunchSite
  /** Tous les radars placés (1-2), tous affichés sur la carte. */
  radars: PlacedRadar[]
  azimuthDeg: number
  /** Distance réelle pas de tir ↔ radar principal, déjà formatée. */
  distance: string
}

// Hauteur du canvas carte par cran (repliée = 0, carte masquée).
const MAP_HEIGHT: Record<string, string> = {
  collapsed: 'h-0',
  compact: 'h-52',
  expanded: 'h-96',
}
const PANEL_WIDTH: Record<string, string> = {
  collapsed: 'w-56',
  compact: 'w-72 max-w-[28vw]',
  expanded: 'w-[38rem] max-w-[60vw]',
}

/**
 * Incrustation tactique 2D (bas-droite) de l'écran de lancement : vue de dessus
 * à l'échelle réelle, là où la distance est FIDÈLE — la scène 3D montre le pas
 * de tir à taille humaine. Trois crans (repliée → compacte → agrandie) via deux
 * boutons ; interactive (pan/zoom, faisceau radar) une fois agrandie. Logique
 * carte dans useLaunchTacticalMap.
 */
export function LaunchTacticalMap({ site, radars, azimuthDeg, distance }: LaunchTacticalMapProps) {
  const { size, grow, shrink } = useMapExpansion()
  const { containerRef } = useLaunchTacticalMap({
    site,
    radars,
    azimuthDeg,
    expanded: size === 'expanded',
  })

  return (
    <div
      className={`pointer-events-auto absolute right-6 bottom-6 overflow-hidden rounded-2xl bg-bg/70 shadow-xl shadow-black/50 ring-1 ring-accent-bright/10 backdrop-blur-sm transition-all duration-300 ${PANEL_WIDTH[size]}`}
    >
      <div className="relative z-10 flex items-center justify-between px-3.5 py-2">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-ink-dim uppercase">Vue tactique</span>
        <div className="flex items-center gap-3">
          {size !== 'collapsed' && <span className="font-mono text-xs text-accent-bright">{distance}</span>}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={shrink}
              disabled={size === 'collapsed'}
              aria-label="Réduire la carte"
              className="flex h-6 w-6 items-center justify-center rounded-md text-base leading-none text-ink-dim transition-colors hover:bg-surface hover:text-accent-bright disabled:opacity-30"
            >
              −
            </button>
            <button
              type="button"
              onClick={grow}
              disabled={size === 'expanded'}
              aria-label="Agrandir la carte"
              className="flex h-6 w-6 items-center justify-center rounded-md text-base leading-none text-ink-dim transition-colors hover:bg-surface hover:text-accent-bright disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
      </div>
      <div ref={containerRef} className={`w-full transition-all duration-300 ${MAP_HEIGHT[size]}`} />
    </div>
  )
}
