import { Navigate, useLocation } from 'react-router-dom'
import { LaunchSceneCanvas } from '@/three/canvas/LaunchSceneCanvas'
import { LaunchHud } from '@/components/sections/Lancement/LaunchHud'
import { LaunchTacticalMap } from '@/components/sections/Lancement/LaunchTacticalMap'
import { MissionBilan } from '@/components/sections/Lancement/MissionBilan'
import { useLaunchSequence } from '@/hooks/useLaunchSequence'
import { computeRadarSceneOffset } from '@/lib/computeRadarSceneOffset'
import { computeDistanceKm, formatDistance } from '@/lib/computeDistanceKm'
import { getRadarName } from '@/lib/getRadarName'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar, MesangeLaunchConfig } from '@/types/mission.types'

interface LancementLocationState {
  site: LaunchSite
  scenarioId: number
  /** Radars placés (1-2), tous affichés dans la scène. */
  radars: PlacedRadar[]
  mesangeConfigs: MesangeLaunchConfig[]
  /** Seuil de préavis de détection requis (s), fixé à la création du scénario. */
  detectionThresholdSec: number
}

export function Lancement() {
  const location = useLocation()
  const state = location.state as LancementLocationState | null

  // Garde-fou : sans scénario enregistré + au moins un radar placé, retour HUD.
  if (!state?.site || !state.scenarioId || !state.radars?.length) {
    return <Navigate to="/mission" replace />
  }

  return <LancementScene state={state} />
}

interface LancementSceneProps {
  state: LancementLocationState
}

function LancementScene({ state }: LancementSceneProps) {
  // Radar principal (1er placé) : sert au HUD, à la séquence et à la carte
  // tactique. Sa position est garantie non-nulle (filtrée au lancement).
  const primaryRadar = state.radars[0]
  const primaryPosition = primaryRadar.position!

  const distance = formatDistance(computeDistanceKm(state.site, primaryPosition))
  const radarName = getRadarName(primaryRadar.config.templateId)

  // Offset scène de CHAQUE radar (direction réelle, distance bornée = contexte).
  const radarsInScene = state.radars
    .filter((radar) => radar.position !== null)
    .map((radar) => ({
      id: radar.id,
      config: radar.config,
      offset: computeRadarSceneOffset(state.site, radar.position!),
    }))

  // Menace principale (Roi si présent, sinon la première) : cale la rampe.
  const primary = state.mesangeConfigs.find((m) => m.role === 'KING') ?? state.mesangeConfigs[0]

  const sequence = useLaunchSequence({
    site: state.site,
    radars: state.radars,
    mesangeConfigs: state.mesangeConfigs,
  })

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg">
      <LaunchSceneCanvas
        radars={radarsInScene}
        launchEnabled={sequence.phase === 'armed'}
        onLaunch={sequence.launch}
        inclinationDeg={primary?.inclinationDeg ?? 80}
        azimuthDeg={primary?.azimuthDeg ?? 0}
        flying={sequence.phase === 'igniting' || sequence.phase === 'running'}
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

      <LaunchTacticalMap
        site={state.site}
        radars={state.radars}
        azimuthDeg={primary?.azimuthDeg ?? 0}
        distance={distance}
      />

      <LaunchHud
        siteName={state.site.name}
        radarName={radarName}
        phase={sequence.phase}
        countdown={sequence.countdown}
        onReplay={sequence.replay}
      />
    </div>
  )
}
