import { MissionPlacementMap } from '../MissionPlacementMap'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

interface StepPositionProps {
  site: LaunchSite
  radarPosition: RadarPosition | null
  onPlaceRadar: (position: RadarPosition) => void
}

export function StepPosition({ site, radarPosition, onPlaceRadar }: StepPositionProps) {
  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-4">
      <p className="text-sm font-medium text-ink-dim">
        Placez le radar sur le terrain — le pas de tir est fixe
      </p>
      <div className="min-h-[52vh] flex-1 overflow-hidden rounded-3xl bg-surface shadow-xl shadow-black/30">
        <MissionPlacementMap site={site} radarPosition={radarPosition} onPlaceRadar={onPlaceRadar} />
      </div>
    </div>
  )
}
