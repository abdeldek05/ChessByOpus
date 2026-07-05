import { Navigate, useLocation } from 'react-router-dom'
import { LaunchSceneCanvas } from '@/three/canvas/LaunchSceneCanvas'
import { computeRadarSceneOffset } from '@/lib/computeRadarSceneOffset'
import { computeDistanceKm, formatDistance } from '@/lib/computeDistanceKm'
import { getRadarName } from '@/lib/getRadarName'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarConfig } from '@/types/radar.types'
import type { RadarPosition, MesangeLaunchConfig } from '@/types/mission.types'

interface LancementLocationState {
  site: LaunchSite
  radarConfig: RadarConfig
  radarPosition: RadarPosition
  mesangeConfigs: MesangeLaunchConfig[]
}

export function Lancement() {
  const location = useLocation()
  const state = location.state as LancementLocationState | null

  if (!state?.site || !state.radarConfig || !state.radarPosition) {
    return <Navigate to="/mission" replace />
  }

  const radarOffset = computeRadarSceneOffset(state.site, state.radarPosition)
  const distance = formatDistance(computeDistanceKm(state.site, state.radarPosition))

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg">
      <LaunchSceneCanvas
        radarConfig={state.radarConfig}
        radarOffset={radarOffset}
        className="h-full w-full"
      />

      <div className="pointer-events-none absolute top-6 left-6 space-y-1 font-mono">
        <p className="text-[11px] tracking-[0.2em] text-ink-dim uppercase">{state.site.name}</p>
        <p className="text-xs text-ink">
          {getRadarName(state.radarConfig.templateId)} · {distance} du pas de tir
        </p>
        <p className="text-[10px] tracking-[0.15em] text-ink-faint uppercase">
          Mise en place — trajectoire RocketPy à venir
        </p>
      </div>
    </div>
  )
}
