import { Navigate, useLocation } from 'react-router-dom'
import { LaunchSceneCanvas } from '@/three/canvas/LaunchSceneCanvas'
import { LaunchHud } from '@/components/sections/Lancement/LaunchHud'
import { TelemetryPanel } from '@/components/sections/Lancement/TelemetryPanel'
import { useLaunchSequence } from '@/hooks/useLaunchSequence'
import { buildTelemetry } from '@/lib/buildTelemetry'
import { computeRadarSceneOffset } from '@/lib/computeRadarSceneOffset'
import { computeDistanceKm, formatDistance } from '@/lib/computeDistanceKm'
import { getRadarName } from '@/lib/getRadarName'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarConfig } from '@/types/radar.types'
import type { RadarPosition, MesangeLaunchConfig } from '@/types/mission.types'

interface LancementLocationState {
  site: LaunchSite
  scenarioId: number
  radarConfig: RadarConfig
  radarPosition: RadarPosition
  mesangeConfigs: MesangeLaunchConfig[]
}

export function Lancement() {
  const location = useLocation()
  const state = location.state as LancementLocationState | null

  // Garde-fou : sans scénario enregistré + radar placé, on repart au HUD.
  if (!state?.site || !state.scenarioId || !state.radarConfig || !state.radarPosition) {
    return <Navigate to="/mission" replace />
  }

  return <LancementScene state={state} />
}

interface LancementSceneProps {
  state: LancementLocationState
}

function LancementScene({ state }: LancementSceneProps) {
  const radarOffset = computeRadarSceneOffset(state.site, state.radarPosition)
  const distance = formatDistance(computeDistanceKm(state.site, state.radarPosition))
  const radarName = getRadarName(state.radarConfig.templateId)

  // Menace principale suivie par la caméra : la KING, sinon la première.
  const primary = state.mesangeConfigs.find((m) => m.role === 'KING') ?? state.mesangeConfigs[0]

  const sequence = useLaunchSequence({
    scenarioId: state.scenarioId,
    radarPosition: state.radarPosition,
    radarOffset,
    radarRangeKm: state.radarConfig.rangeKm,
    primary,
  })

  const showTrajectory =
    sequence.phase === 'flight' || sequence.phase === 'running' || sequence.phase === 'done'

  const telemetry = buildTelemetry({
    phase: sequence.phase,
    radarName,
    elapsedSec: sequence.stats.elapsedSec,
    altitudeKm: sequence.stats.altitudeKm,
    radarDistanceKm: sequence.stats.distanceKm,
    speedMs: sequence.stats.speedMs,
    detected: sequence.stats.detected,
    detectionRangeKm: sequence.stats.detectionRangeKm,
    leadTimeSec: sequence.stats.leadTimeSec,
  })

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg">
      <LaunchSceneCanvas
        radarConfig={state.radarConfig}
        radarOffset={radarOffset}
        launchEnabled={sequence.phase === 'armed'}
        onLaunch={sequence.launch}
        phase={sequence.phase}
        startRef={sequence.startRef}
        azimuthDeg={primary.azimuthDeg}
        inclinationDeg={primary.inclinationDeg}
        showTrajectory={showTrajectory}
        className="h-full w-full"
      />

      <TelemetryPanel model={telemetry} />

      <LaunchHud
        siteName={state.site.name}
        radarName={radarName}
        distance={distance}
        phase={sequence.phase}
        countdown={sequence.countdown}
        message={sequence.message}
        onReplay={sequence.replay}
      />
    </div>
  )
}
