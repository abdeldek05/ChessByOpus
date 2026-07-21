import 'maplibre-gl/dist/maplibre-gl.css'
import { useLaunchTacticalMap } from '@/hooks/useLaunchTacticalMap'
import { useMapExpansion } from '@/hooks/useMapExpansion'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'
import type { FlightData } from '@/lib/api'

interface LaunchTacticalMapProps {
  site: LaunchSite
  /** Tous les radars placés (1-2), tous affichés sur la carte. */
  radars: PlacedRadar[]
  /** Distance réelle pas de tir ↔ radar principal, déjà formatée. */
  distance: string
  /** Trajectoire RocketPy (null tant que non calculée) : tracée comme piste radar. */
  flight: FlightData | null
  /** Progression du vol 0→1 (ref partagée, -1 = pas de vol) : pilote la piste live. */
  flightProgressRef: React.RefObject<number>
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
 * boutons ; pan/zoom souris actifs une fois agrandie. Chaque radar affiche son
 * faisceau rotatif qui balaie en continu, vire à l'alarme quand il accroche la
 * menace. Logique carte dans useLaunchTacticalMap.
 */
export function LaunchTacticalMap({
  site,
  radars,
  distance,
  flight,
  flightProgressRef,
}: LaunchTacticalMapProps) {
  const { size, grow, shrink } = useMapExpansion()
  const { containerRef } = useLaunchTacticalMap({
    site,
    radars,
    expanded: size === 'expanded',
    // Repliée (h-0, invisible) : inutile de faire tourner les boucles rAF
    // (piste + faisceau radar) qui repeignent MapLibre à chaque frame et se
    // disputent le thread principal avec le Canvas WebGL pour rien.
    visible: size !== 'collapsed',
    flight,
    flightProgressRef,
  })

  return (
    <div
      className={`pointer-events-auto absolute right-6 bottom-6 overflow-hidden rounded-2xl bg-bg/70 shadow-xl shadow-black/50 ring-1 ring-accent-bright/10 backdrop-blur-sm transition-all duration-300 ${PANEL_WIDTH[size]}`}
    >
      <div className="relative z-10 flex items-center justify-between px-3.5 py-2">
        <span className="font-fine text-[11px] font-light tracking-[0.28em] text-ink-dim uppercase">Tactical view</span>
        <div className="flex items-center gap-3">
          {size !== 'collapsed' && <span className="font-mono text-xs text-accent-bright">{distance}</span>}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={shrink}
              disabled={size === 'collapsed'}
              aria-label="Shrink map"
              className="flex h-6 w-6 items-center justify-center rounded-md text-base leading-none text-ink-dim transition-colors hover:bg-surface hover:text-accent-bright disabled:opacity-30"
            >
              −
            </button>
            <button
              type="button"
              onClick={grow}
              disabled={size === 'expanded'}
              aria-label="Expand map"
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
