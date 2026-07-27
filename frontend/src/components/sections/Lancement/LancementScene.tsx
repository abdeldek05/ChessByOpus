import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LaunchStage } from './LaunchStage'
import { DayNightToggle } from './DayNightToggle'
import { CameraModeSelector } from './CameraModeSelector'
import { ProfileToggleButton } from './ProfileToggleButton'
import { CoverageProfilePanel } from './CoverageProfilePanel'
import { LaunchHud } from './LaunchHud'
import { LaunchTacticalMap } from './LaunchTacticalMap'
import { CorridorLegend } from './CorridorLegend'
import { DetectionStatusHud } from './DetectionStatusHud'
import { useDetectionStatus } from '@/hooks/useDetectionStatus'
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
import type { SceneMode, CameraMode } from '@/types/scene.types'
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
  // Mode de caméra en vol (sélecteur HUD) : suivi King / vue radar / vue large.
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow')
  // Panneau latéral du profil de couverture (coupe Thales) : ouvert/fermé.
  const [profileOpen, setProfileOpen] = useState(false)

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

  // Trajectoires des LEURRES (tout sauf le Roi) pour la carte tactique :
  // tracées en entier, statiques, teintées par rôle (voir drawDecoyTracks).
  // Le Roi garde sa piste live séparée (prop `flight`).
  const decoyTracks = useMemo(
    () =>
      flightPlan
        .filter((plan) => !plan.isKing)
        .map((plan) => ({
          id: plan.config.id,
          role: plan.config.role,
          flight: plan.flight,
          launchDelaySec: plan.config.launchDelaySec,
        })),
    [flightPlan],
  )

  // Portée du vol, dérivée SYNCHRONE du plan de vol : max de TOUTE la flotte
  // (un leurre moins incliné va PLUS LOIN que le Roi — portée balistique
  // maximale vers 45° — sans ce max il sortirait du cadre de la scène
  // normalisée). `flightPlan` vient de `sequence.flight`, un state posé UNE
  // SEULE FOIS au démarrage du vol et stable ensuite → cette valeur est donc
  // stable pendant toute l'animation, sans avoir besoin d'un state + effet.
  //
  // C'ÉTAIT UNE CAUSE DES « GROS BONDS » : l'ancienne version passait par un
  // useState rempli dans un useEffect, donc `flightRangeAtLaunch` valait encore
  // `null` à la PREMIÈRE frame du vol, puis sautait à sa vraie valeur à la frame
  // suivante → `sceneScale` (donc metersPerSceneUnit) CHANGEAIT en plein vol →
  // le useMemo de la spline dans useTrajectoryPlayback se recréait avec un autre
  // facteur d'échelle sous les pieds de l'animation → la fusée SAUTAIT. En
  // dérivant la portée de façon synchrone, metersPerSceneUnit est déjà correct
  // à la frame 0 et ne bouge plus.
  const flightRangeAtLaunch = useMemo(
    () => (flightPlan.length > 0 ? Math.max(...flightPlan.map((p) => p.flight.rangeM)) : 0),
    [flightPlan],
  )
  const sceneScale = useMemo(
    () => computeSceneScale(Math.max(maxRadarDistanceM, flightRangeAtLaunch)),
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

  // Fin de vol / réarmement : on revient AUTOMATIQUEMENT en mode caméra 'follow'
  // — seul ce mode gère le retour doux de la caméra vers le pad et le cadrage
  // de départ (les vues radar/wide sont posées à un point fixe et ne
  // « reviennent » pas). Sans ça, rester en RADAR/WIDE au clic Replay/Analytics
  // laissait la caméra figée dans un cadrage incohérent au lieu de revenir.
  useEffect(() => {
    if (sequence.phase !== 'running') setCameraMode('follow')
  }, [sequence.phase])

  // Statut de détection LIVE du Roi (voir DetectionStatusHud) : recalculé
  // dans une boucle rAF dédiée, indépendante de ce re-render (useDetectionStatus).
  const detectionStatus = useDetectionStatus(state.site, state.radars, sequence.flight, flightProgressRef)

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
        cameraMode={cameraMode}
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

      {/* Sélecteur de caméra : visible pendant le vol (suivi King / vue radar /
          vue large). Masqué au sol (rien à suivre encore). */}
      {sequence.phase === 'running' && <CameraModeSelector mode={cameraMode} onSelect={setCameraMode} />}

      {/* Profil de couverture (coupe Thales) : bouton (sous les caméras) + panneau
          latéral, dès qu'un vol est connu (trajectoire dispo). Dans un grand
          panneau à part, le graphe respire — plus dans l'incrustation exiguë. */}
      {sequence.flight && (
        <>
          <ProfileToggleButton open={profileOpen} onToggle={() => setProfileOpen((v) => !v)} />
          <CoverageProfilePanel
            open={profileOpen}
            onClose={() => setProfileOpen(false)}
            flight={sequence.flight}
            decoyTracks={decoyTracks}
            kingDelaySec={primary?.launchDelaySec ?? 0}
            site={state.site}
            radars={state.radars}
            azimuthDeg={primary?.azimuthDeg ?? 0}
            flightProgressRef={flightProgressRef}
          />
        </>
      )}

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

      {/* Bandeau « pourquoi » : nomme en direct la raison de détection/perte
          du Roi (voir DetectionStatusHud) — seulement pendant le vol actif
          (running), pas après l'atterrissage (le statut n'aurait plus de sens). */}
      {sequence.phase === 'running' && (
        <DetectionStatusHud status={detectionStatus} radarCount={state.radars.length} />
      )}

      <LaunchTacticalMap
        site={state.site}
        radars={state.radars}
        distance={distance}
        flight={sequence.flight}
        decoyTracks={decoyTracks}
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
