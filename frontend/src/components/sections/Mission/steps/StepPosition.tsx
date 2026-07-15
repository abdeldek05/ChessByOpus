import { useState } from 'react'
import { MissionPlacementMap } from '../MissionPlacementMap'
import { useRocketMaxRange } from '@/hooks/useRocketMaxRange'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition, PlacedRadar } from '@/types/mission.types'

interface StepPositionProps {
  site: LaunchSite
  radars: PlacedRadar[]
  onPlaceRadar: (id: string, position: RadarPosition) => void
}

/**
 * Étape de placement : 1 à 2 radars à poser sur la carte. Garde localement
 * quel radar est actuellement édité (comme les onglets de l'étape Radar) — le
 * clic sur la carte positionne toujours l'actif, jamais les autres. La carte
 * montre aussi la distance max théorique de la Mesange (météo réelle du site)
 * pour situer la couverture radar par rapport à la portée du tir.
 */
export function StepPosition({ site, radars, onPlaceRadar }: StepPositionProps) {
  const [activeRadarId, setActiveRadarId] = useState(radars[0]?.id ?? '')
  const active = radars.find((r) => r.id === activeRadarId) ?? radars[0]
  const { maxRangeKm } = useRocketMaxRange(site)

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-4">
      <p className="text-sm font-medium text-ink-dim">
        Place {radars.length > 1 ? 'each radar' : 'the radar'} within its coverage zone — the circle shows its
        operating radius ({active?.config.rangeKm} km)
      </p>
      <div className="min-h-[52vh] flex-1 overflow-hidden rounded-3xl bg-surface shadow-xl shadow-black/30">
        <MissionPlacementMap
          site={site}
          radars={radars}
          activeRadarId={activeRadarId || radars[0]?.id}
          onSelectActive={setActiveRadarId}
          onPlaceRadar={onPlaceRadar}
          rocketMaxRangeKm={maxRangeKm}
        />
      </div>
    </div>
  )
}
