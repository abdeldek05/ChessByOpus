import { Navigate, useLocation } from 'react-router-dom'
import { LaunchSceneCanvas } from '@/three/canvas/LaunchSceneCanvas'
import { LaunchHud } from '@/components/sections/Lancement/LaunchHud'
import { MissionBilan } from '@/components/sections/Lancement/MissionBilan'
import { useLaunchSequence } from '@/hooks/useLaunchSequence'
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
  /** Seuil de préavis de détection requis (s), fixé à la création du scénario. */
  detectionThresholdSec: number
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

  // Menace principale (Roi si présent, sinon la première) : cale la rampe.
  const primary = state.mesangeConfigs.find((m) => m.role === 'KING') ?? state.mesangeConfigs[0]

  const sequence = useLaunchSequence({
    scenarioId: state.scenarioId,
    radarPosition: state.radarPosition,
  })

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg">
      <LaunchSceneCanvas
        radarConfig={state.radarConfig}
        radarOffset={radarOffset}
        launchEnabled={sequence.phase === 'armed'}
        onLaunch={sequence.launch}
        inclinationDeg={primary?.inclinationDeg ?? 80}
        azimuthDeg={primary?.azimuthDeg ?? 0}
        className="h-full w-full"
      />

      {(sequence.phase === 'done' || sequence.phase === 'error') && (
        <MissionBilan
          result={sequence.result}
          siteName={state.site.name}
          radarName={radarName}
          requiredLeadSec={state.detectionThresholdSec ?? 30}
        />
      )}

      <LaunchHud
        siteName={state.site.name}
        radarName={radarName}
        distance={distance}
        phase={sequence.phase}
        countdown={sequence.countdown}
        onReplay={sequence.replay}
      />
    </div>
  )
}
