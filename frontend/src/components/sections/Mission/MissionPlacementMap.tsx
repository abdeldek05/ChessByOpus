import { useMissionPlacementMap } from '@/hooks/useMissionPlacementMap'
import { computeDistanceKm, formatDistance } from '@/lib/computeDistanceKm'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

interface MissionPlacementMapProps {
  site: LaunchSite
  radarPosition: RadarPosition | null
  rangeKm: number
  onPlaceRadar: (position: RadarPosition) => void
}

export function MissionPlacementMap({ site, radarPosition, rangeKm, onPlaceRadar }: MissionPlacementMapProps) {
  const { containerRef } = useMissionPlacementMap({ site, radarPosition, rangeKm, onPlaceRadar })

  const distanceKm = radarPosition ? computeDistanceKm(site, radarPosition) : null
  const inRange = distanceKm !== null && distanceKm <= rangeKm

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      <p className="pointer-events-none absolute top-3 left-3 rounded-lg bg-bg/70 px-2.5 py-1.5 text-[11px] font-medium tracking-wide text-ink-dim backdrop-blur-sm">
        Cliquez sur la carte pour placer le radar
      </p>

      {distanceKm !== null && (
        <div className="pointer-events-none absolute right-3 bottom-3 rounded-lg bg-bg/70 px-3 py-2 text-right backdrop-blur-sm">
          <p className="text-sm font-semibold text-accent-bright">{formatDistance(distanceKm)} du pas de tir</p>
          <p className={`text-[11px] font-medium ${inRange ? 'text-ok' : 'text-alert'}`}>
            {inRange ? 'Dans la portée du radar' : 'Hors de portée du radar'}
          </p>
        </div>
      )}
    </div>
  )
}
