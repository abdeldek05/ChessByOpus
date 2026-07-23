import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LaunchStage } from './LaunchStage'
import { DayNightToggle } from './DayNightToggle'
import { LaunchHud } from './LaunchHud'
import { LaunchTacticalMap } from './LaunchTacticalMap'
import { CorridorLegend } from './CorridorLegend'
import { MissionBilan } from './MissionBilan'
import { FlightTelemetryChart } from './FlightTelemetryChart'
import { SceneLoadingOverlay } from './SceneLoadingOverlay'
import { LaunchComputingOverlay } from './LaunchComputingOverlay'
import { useLaunchSequence } from '@/hooks/useLaunchSequence'
import { ROCKET_MAX_RANGE_KM } from '@/constants/rocket'
import { useSceneLoadingOverlay } from '@/hooks/useSceneLoadingOverlay'
import { computeRadarSceneOffset } from '@/lib/computeRadarSceneOffset'
import { computeDistanceKm, formatDistance } from '@/lib/computeDistanceKm'
import { computeSceneScale } from '@/lib/sceneScale'
import { getRadarName } from '@/lib/getRadarName'
import { getMesangeRoleLabel } from '@/lib/getMesangeRoleLabel'
import { buildFleetFlightPlan } from '@/lib/buildFleetFlightPlan'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar, MesangeLaunchConfig } from '@/types/mission.types'
import type { SceneMode } from '@/types/scene.types'
import type { AnalyticsPageState } from '@/types/analytics.types'

/** State de route attendu par l'écran de lancement (posé par MissionConsole). */
export interface LancementLocationState {
  site: LaunchSite
  scenarioId: number
  /** Radars placés (1-2), tous affichés dans la scène. */
  radars: PlacedRadar[]
  mesangeConfigs: MesangeLaunchConfig[]
  /** Seuil de préavis de détection requis (s), fixé à la création du scénario. */
  detectionThresholdSec: number
}

interface LancementSceneProps {
  state: LancementLocationState
}

/**
 * Orchestrateur de l'écran de lancement : assemble la scène 3D (LaunchStage), la
 * carte tactique, le HUD et la bascule jour/nuit autour de la séquence de vol
 * (useLaunchSequence). Toute la mécanique bas-niveau vit dans les sous-composants
 * et hooks — ici on ne fait que câbler les données du scénario.
 */
export function LancementScene({ state }: LancementSceneProps) {
  const navigate = useNavigate()
  // Ambiance de la scène (bouton ☀/☾ du HUD) : jour golden hour ou nuit.
  const [sceneMode, setSceneMode] = useState<SceneMode>('day')

  // Radar principal (1er placé) : sert au HUD, à la séquence et à la carte
  // tactique. Sa position est garantie non-nulle (validée par la garde de route).
  const primaryRadar = state.radars[0]
  const primaryPosition = primaryRadar.position!

  const distance = formatDistance(computeDistanceKm(state.site, primaryPosition))
  const radarName = getRadarName(primaryRadar.config.templateId)

  // Menace principale (Roi si présent, sinon la première) : cale la rampe.
  const primary = state.mesangeConfigs.find((m) => m.role === 'KING') ?? state.mesangeConfigs[0]
  const roleLabel = getMesangeRoleLabel(primary?.role)

  const sequence = useLaunchSequence({
    site: state.site,
    radars: state.radars,
    mesangeConfigs: state.mesangeConfigs,
    king: primary,
  })

  // Écran de chargement affiché le temps que la scène 3D (GLB, HDRI, terrain)
  // monte — purement cosmétique, voir useSceneLoadingOverlay.
  const loadingOverlay = useSceneLoadingOverlay()

  // Échelle UNIQUE de la map fixe (voir sceneScale.ts) : normalise radar ET
  // trajectoire par le même facteur, calculé sur la plus grande distance
  // réelle du scénario (radar le plus loin OU portée du vol une fois connue) —
  // les deux tombent au bon endroit l'un par rapport à l'autre, quelle que
  // soit la vraie distance en km.
  //
  // FIGÉ tant qu'un vol est actif : `sceneScale` dépendait de
  // `sequence.flight?.rangeM`, qui passe de `null` à une vraie valeur PENDANT
  // le vol (dès que le backend répond) — sans ce gel, `sceneScale` changeait
  // de valeur EN PLEIN VOL, ce qui recréait la spline de trajectoire
  // (useMemo de useTrajectoryPlayback dépend de metersPerSceneUnit=1/sceneScale)
  // avec un nouveau `duration` sous les pieds de l'animation déjà en cours
  // (animElapsed ne repart pas à 0) — c'était LA cause du bug où la fusée
  // cassait en l'air à un temps incohérent (tangente encore montante) au lieu
  // de toucher le relief en fin de descente réelle.
  const maxRadarDistanceM = Math.max(
    0,
    ...state.radars
      .filter((radar) => radar.position !== null)
      .map((radar) => computeDistanceKm(state.site, radar.position!) * 1000),
  )

  // Plan de vol de TOUTE la flotte (Roi = vraie trajectoire RocketPy, leurres
  // = dérivée JS calibrée dessus — voir buildFleetFlightPlan). Vide tant que
  // le backend n'a pas répondu (sequence.flight === null) : rien à calibrer.
  const flightPlan = useMemo(
    () => buildFleetFlightPlan(state.mesangeConfigs, sequence.flight),
    [state.mesangeConfigs, sequence.flight],
  )

  // Portée du vol figée dès qu'elle est connue (state, pas juste une ref) :
  // remise à null quand on réarme (replay), pour qu'un nouveau vol puisse à
  // nouveau capturer sa propre portée sans jamais changer PENDANT l'animation.
  // Portée = MAX de TOUTE la flotte (pas juste le Roi) : un leurre moins
  // incliné va PLUS LOIN que le Roi (portée balistique maximale vers 45°) —
  // sans ce max, un tel leurre sortirait du cadre de la scène normalisée.
  const [flightRangeAtLaunch, setFlightRangeAtLaunch] = useState<number | null>(null)
  useEffect(() => {
    if (sequence.phase === 'armed') {
      setFlightRangeAtLaunch(null)
    } else if (flightPlan.length > 0) {
      const maxFleetRangeM = Math.max(...flightPlan.map((p) => p.flight.rangeM))
      setFlightRangeAtLaunch((prev) => prev ?? maxFleetRangeM)
    }
  }, [sequence.phase, flightPlan])
  const sceneScale = useMemo(
    () => computeSceneScale(Math.max(maxRadarDistanceM, flightRangeAtLaunch ?? 0)),
    [maxRadarDistanceM, flightRangeAtLaunch],
  )

  // Offset scène de CHAQUE radar (direction réelle, normalisée par sceneScale).
  // Mémoïsé : pendant le décompte, `countdown` re-render ce composant chaque
  // seconde — sans ça, on recrée le tableau + computeRadarSceneOffset par radar
  // et on repropage une nouvelle référence de props au sous-arbre <Canvas>.
  const radarsInScene = useMemo(
    () =>
      state.radars
        .filter((radar) => radar.position !== null)
        .map((radar) => ({
          id: radar.id,
          config: radar.config,
          offset: computeRadarSceneOffset(state.site, radar.position!, sceneScale),
        })),
    [state.radars, state.site, sceneScale],
  )

  // Progression du vol (0→1) partagée entre le moteur 3D (qui l'écrit à chaque
  // frame) et la Tactical View (qui la lit dans sa boucle rAF pour dessiner la
  // piste radar en direct) — sans re-render React. -1 = aucun vol en cours.
  const flightProgressRef = useRef(-1)
  useEffect(() => {
    if (sequence.phase !== 'running') flightProgressRef.current = -1
  }, [sequence.phase])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg">
      <LaunchStage
        radars={radarsInScene}
        launchEnabled={sequence.phase === 'armed'}
        onLaunch={sequence.launch}
        inclinationDeg={primary?.inclinationDeg ?? 80}
        azimuthDeg={primary?.azimuthDeg ?? 0}
        flying={sequence.phase === 'running'}
        flightPlan={flightPlan}
        flightProgressRef={flightProgressRef}
        onImpact={sequence.reportImpact}
        onSceneReady={loadingOverlay.reportSceneReady}
        metersPerSceneUnit={1 / sceneScale}
        rangeKm={ROCKET_MAX_RANGE_KM}
        roleLabel={roleLabel}
        site={state.site}
        placedRadars={state.radars}
        mode={sceneMode}
        className="h-full w-full"
      />

      {/* Écran de chargement : couvre le montage de la scène 3D, disparaît une
          fois la scène prête ET la durée minimum cosmétique écoulée. */}
      {loadingOverlay.visible && (
        <SceneLoadingOverlay progress={loadingOverlay.progress} message={loadingOverlay.message} />
      )}

      {/* Overlay de calcul de tir : prend le relais dès que le décompte 3-2-1
          atteint 0, le temps que le backend réponde — remplace l'ancien « GO »
          figé. Disparaît pile quand le vol démarre (phase → 'running'). */}
      <LaunchComputingOverlay
        active={sequence.phase === 'countdown' && sequence.countdown <= 0}
      />

      {/* Bascule d'ambiance jour ☀ / nuit ☾ de la scène. */}
      <DayNightToggle
        mode={sceneMode}
        onToggle={() => setSceneMode((current) => (current === 'day' ? 'night' : 'day'))}
      />

      {(sequence.phase === 'done' || sequence.phase === 'error') && (
        <MissionBilan
          result={sequence.result}
          siteName={state.site.name}
          radarName={radarName}
          requiredLeadSec={state.detectionThresholdSec ?? 30}
          weather={sequence.weather}
          onReplay={sequence.replay}
        />
      )}

      {sequence.phase === 'done' && <FlightTelemetryChart flight={sequence.flight} />}

      {/* Légende du corridor de visibilité : visible dès qu'un vol est lancé
          (running) et jusqu'à la fin, pour expliquer le tracé coloré. */}
      {(sequence.phase === 'running' || sequence.phase === 'done') && <CorridorLegend />}

      <LaunchTacticalMap
        site={state.site}
        radars={state.radars}
        distance={distance}
        flight={sequence.flight}
        flightProgressRef={flightProgressRef}
      />

      <LaunchHud
        siteName={state.site.name}
        radarName={radarName}
        phase={sequence.phase}
        countdown={sequence.countdown}
        message={sequence.message}
        onLaunch={sequence.launch}
        onReplay={sequence.replay}
        onAnalytics={
          sequence.flight
            ? () =>
                navigate('/analytics', {
                  state: {
                    site: state.site,
                    radars: state.radars,
                    mesangeConfigs: state.mesangeConfigs,
                    detectionThresholdSec: state.detectionThresholdSec ?? 30,
                    flight: sequence.flight!,
                    result: sequence.result,
                  } satisfies AnalyticsPageState,
                })
            : undefined
        }
      />
    </div>
  )
}
