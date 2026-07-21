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
import { useLaunchSequence } from '@/hooks/useLaunchSequence'
import { useRocketMaxRange } from '@/hooks/useRocketMaxRange'
import { useSceneLoadingOverlay } from '@/hooks/useSceneLoadingOverlay'
import { computeRadarSceneOffset } from '@/lib/computeRadarSceneOffset'
import { computeDistanceKm, formatDistance } from '@/lib/computeDistanceKm'
import { computeSceneScale } from '@/lib/sceneScale'
import { getRadarName } from '@/lib/getRadarName'
import { getMesangeRoleLabel } from '@/lib/getMesangeRoleLabel'
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

  // Portée max estimée du missile (km) sous la météo réelle du site : affichée
  // dans la fiche technique sur le pad (RocketInfoHologram), null tant que non
  // reçue — chargée une fois par site, indépendante de la séquence de vol.
  const { maxRangeKm } = useRocketMaxRange(state.site)

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
  // Portée du vol figée dès qu'elle est connue (state, pas juste une ref) :
  // remise à null quand on réarme (replay), pour qu'un nouveau vol puisse à
  // nouveau capturer sa propre portée sans jamais changer PENDANT l'animation.
  const [flightRangeAtLaunch, setFlightRangeAtLaunch] = useState<number | null>(null)
  useEffect(() => {
    if (sequence.phase === 'armed') {
      setFlightRangeAtLaunch(null)
    } else if (sequence.flight) {
      setFlightRangeAtLaunch((prev) => prev ?? sequence.flight!.rangeM)
    }
  }, [sequence.phase, sequence.flight])
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
        flight={sequence.flight}
        flightProgressRef={flightProgressRef}
        onImpact={sequence.reportImpact}
        onSceneReady={loadingOverlay.reportSceneReady}
        metersPerSceneUnit={1 / sceneScale}
        rangeKm={maxRangeKm}
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

      {/* Bascule d'ambiance jour ☀ / nuit ☾ de la scène. */}
      <DayNightToggle
        mode={sceneMode}
        onToggle={() => setSceneMode((current) => (current === 'day' ? 'night' : 'day'))}
      />

      {/* TEST DEBUG : bilan de mission (résultat radar) masqué le temps de
          diagnostiquer le bug d'impact au sol de la fusée — évite de polluer
          les tests visuels avec ce panneau. À réactiver une fois le bug résolu. */}
      {false && (sequence.phase === 'done' || sequence.phase === 'error') && (
        <MissionBilan
          result={sequence.result}
          siteName={state.site.name}
          radarName={radarName}
          requiredLeadSec={state.detectionThresholdSec ?? 30}
          weather={sequence.weather}
          onReplay={sequence.replay}
        />
      )}

      {false && sequence.phase === 'done' && <FlightTelemetryChart flight={sequence.flight} />}

      {/* Légende du corridor de visibilité : visible dès qu'un vol est lancé
          (running) et jusqu'à la fin, pour expliquer le tracé coloré. */}
      {(sequence.phase === 'running' || sequence.phase === 'done') && <CorridorLegend />}

      <LaunchTacticalMap
        site={state.site}
        radars={state.radars}
        azimuthDeg={primary?.azimuthDeg ?? 0}
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
