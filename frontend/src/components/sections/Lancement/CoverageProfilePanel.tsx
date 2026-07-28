import { useState } from 'react'
import { TrajectoryPlot3D } from './TrajectoryPlot3D'
import { CoverageWindowsSummary } from './CoverageWindowsSummary'
import { CoverageLiveBar } from './CoverageLiveBar'
import { CoverageProfileLegend } from './CoverageProfileLegend'
import { useCoverageCut } from '@/hooks/useCoverageCut'
import { useCoverageProfileLive } from '@/hooks/useCoverageProfileLive'
import { useProfileLegendItems } from '@/hooks/useProfileLegendItems'
import type { ProfileSelection } from '@/types/coverageProfile.types'
import type { DecoyTrack } from '@/lib/launchTacticalMap'
import type { FlightData } from '@/lib/api'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

interface CoverageProfilePanelProps {
  open: boolean
  onClose: () => void
  flight: FlightData
  /** Trajectoires des leurres (Dame/pions) — tracées en contexte dans le profil. */
  decoyTracks?: DecoyTrack[]
  /** Délai de mise à feu du Roi (s) : le temps MISSION courant vaut
   *  kingDelaySec + temps de vol du Roi — base pour placer chaque leurre à son
   *  vrai timing (voir TrajectoryPlotScene). */
  kingDelaySec?: number
  site: LaunchSite
  radars: PlacedRadar[]
  azimuthDeg: number
  /** Progression du vol 0→1 (ref partagée) — tête + tracé progressif live. */
  flightProgressRef: React.RefObject<number>
}

/**
 * PANNEAU LATÉRAL du profil de couverture radar (coupe distance-sol × altitude
 * dans l'axe de tir, exigence Thales) : glisse depuis la GAUCHE. Le graphe 3D y
 * occupe TOUTE la hauteur dispo ; il se trace AU FUR ET À MESURE du vol
 * (tracking radar). Un BANDEAU LIVE (état courant : T+, alt, distance, vu/angle
 * mort) surmonte le graphe, et le récap par radar sous le graphe se remplit au
 * fil du vol. Le hook live (index + visibilité courante) est appelé ICI et
 * partagé entre le graphe (tracé progressif) et le bandeau/récap.
 */
export function CoverageProfilePanel({
  open,
  onClose,
  flight,
  decoyTracks,
  kingDelaySec = 0,
  site,
  radars,
  azimuthDeg,
  flightProgressRef,
}: CoverageProfilePanelProps) {
  const cut = useCoverageCut({ flight, site, radars, azimuthDeg })
  const live = useCoverageProfileLive(cut, flightProgressRef)
  // Courbe mise en avant : pilotée indifféremment par un clic sur le graphe 3D
  // ou sur la légende — un seul état pour les deux, donc jamais de désaccord.
  const [selection, setSelection] = useState<ProfileSelection>(null)
  const legendItems = useProfileLegendItems(cut.radarCuts, decoyTracks)

  return (
    <aside
      className={`hud-glass--dense clip-corner-14 pointer-events-auto absolute top-6 left-6 bottom-6 z-30 flex w-[42vw] max-w-[640px] min-w-[380px] flex-col transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'
      }`}
    >
      <header className="flex items-center justify-between border-b border-accent-bright/15 px-4 py-3">
        <span className="font-fine text-xs font-light tracking-wide-hud text-accent-bright uppercase">
          Coverage profile
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className="flex h-7 w-7 items-center justify-center rounded text-lg leading-none text-ink-dim transition-colors hover:bg-accent-bright/15 hover:text-accent-bright"
        >
          ×
        </button>
      </header>

      {/* Bandeau LIVE : état de la menace à l'instant courant du vol. */}
      <CoverageLiveBar live={live} radarCuts={cut.radarCuts} />

      {/* Le graphe occupe TOUTE la hauteur restante. Ne monte (Canvas actif)
          que panneau ouvert. */}
      <div className="min-h-0 flex-1">
        {open && (
          <TrajectoryPlot3D
            flight={flight}
            cut={cut}
            decoyTracks={decoyTracks}
            kingDelaySec={kingDelaySec}
            liveTSec={live.tSec}
            site={site}
            radars={radars}
            flightProgressRef={flightProgressRef}
            liveIndex={live.index}
            selection={selection}
            onSelect={setSelection}
          />
        )}
      </div>

      {/* Légende ET sélecteur : cliquer une entrée illumine sa courbe dans le
          graphe, et cliquer une courbe met son entrée en avant ici. */}
      <CoverageProfileLegend items={legendItems} selection={selection} onSelect={setSelection} />

      {/* Récap par radar (se remplit au fil du vol via liveIndex). */}
      <CoverageWindowsSummary radarCuts={cut.radarCuts} liveIndex={live.index} />
    </aside>
  )
}
