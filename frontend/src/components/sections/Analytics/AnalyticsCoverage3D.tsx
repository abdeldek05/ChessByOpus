import { useRef, useState } from 'react'
import { TrajectoryPlot3D } from '../Lancement/TrajectoryPlot3D'
import { CoverageProfileLegend } from '../Lancement/CoverageProfileLegend'
import { useProfileLegendItems } from '@/hooks/useProfileLegendItems'
import type { CoverageCut } from '@/hooks/useCoverageCut'
import type { ProfileSelection } from '@/types/coverageProfile.types'
import type { DecoyTrack } from '@/lib/launchTacticalMap'
import type { FlightData } from '@/lib/api'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

interface AnalyticsCoverage3DProps {
  flight: FlightData
  cut: CoverageCut
  decoyTracks?: DecoyTrack[]
  kingDelaySec?: number
  site: LaunchSite
  radars: PlacedRadar[]
}

/** Aucun vol en cours sur un débrief : `-1` fait afficher la trace ENTIÈRE (voir
 *  TrajectoryPlotScene, où `liveIndex < 0` révèle tous les points). */
const STATIC_INDEX = -1

/**
 * Volume de couverture radar en 3D pour le débrief : le même graphe instrumenté
 * que le panneau PROFIL de la scène de lancement, mais en version STATIQUE (vol
 * terminé, trace intégrale) et intégré dans la grille de la page.
 *
 * Les courbes restent cliquables : un clic illumine une trajectoire ou les
 * portions vues par un radar, et estompe le reste. La légende pilote le même
 * état dans les deux sens.
 */
export function AnalyticsCoverage3D({
  flight,
  cut,
  decoyTracks,
  kingDelaySec = 0,
  site,
  radars,
}: AnalyticsCoverage3DProps) {
  const [selection, setSelection] = useState<ProfileSelection>(null)
  const legendItems = useProfileLegendItems(cut.radarCuts, decoyTracks)
  // Le graphe attend la ref de progression du moteur de vol ; sur un débrief il
  // n'y a rien à animer, donc une ref figée hors-vol suffit.
  const staticProgress = useRef(STATIC_INDEX)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        <TrajectoryPlot3D
          flight={flight}
          cut={cut}
          decoyTracks={decoyTracks}
          kingDelaySec={kingDelaySec}
          site={site}
          radars={radars}
          flightProgressRef={staticProgress}
          liveIndex={STATIC_INDEX}
          selection={selection}
          onSelect={setSelection}
        />
      </div>
      <CoverageProfileLegend items={legendItems} selection={selection} onSelect={setSelection} />
    </div>
  )
}
