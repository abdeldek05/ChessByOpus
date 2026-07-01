import { useMissionPlacementMap } from '@/hooks/useMissionPlacementMap'
import { computeDistanceKm, formatDistance } from '@/lib/computeDistanceKm'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

interface MissionPlacementMapProps {
  site: LaunchSite
  radarPosition: RadarPosition | null
  onPlaceRadar: (position: RadarPosition) => void
}

export function MissionPlacementMap({ site, radarPosition, onPlaceRadar }: MissionPlacementMapProps) {
  const { containerRef } = useMissionPlacementMap({ site, onPlaceRadar })

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      <p className="pointer-events-none absolute top-3 left-3 font-mono text-[10px] tracking-[0.15em] text-ink-faint uppercase">
        Clique sur la carte pour placer le radar
      </p>

      {radarPosition && (
        <p className="pointer-events-none absolute right-3 bottom-3 font-mono text-xs text-accent">
          Radar placé à {formatDistance(computeDistanceKm(site, radarPosition))} du pas de tir
        </p>
      )}
    </div>
  )
}
