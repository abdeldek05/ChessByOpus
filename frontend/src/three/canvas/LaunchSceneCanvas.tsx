import { Suspense, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import * as THREE from 'three'
import { computeRailRocketOrigin } from '@/lib/computeRailRocketOrigin'
import { computeLaunchCameraStart } from '@/lib/computeLaunchCameraStart'
import { GlContextReleaser } from './GlContextReleaser'
import { PostFX } from './PostFX'
import { POSTFX_ENABLED, POSTFX_QUALITY } from '@/three/constants/postFx'
import { PerfHud } from './PerfHud'
import { PHOTO_MODE, PHOTO_DPR_MAX } from '@/three/constants/photoMode'
import { GroundMesh } from '@/three/models/GroundMesh'
import { FarHorizon } from '@/three/models/FarHorizon'
import { HorizonHaze } from '@/three/models/HorizonHaze'
import { VolumetricClouds } from '@/three/models/VolumetricClouds'
import { VOLUMETRIC_CLOUDS_ENABLED } from '@/three/constants/volumetricClouds'
import { GrassField } from '@/three/models/GrassField'
import { RockField } from '@/three/models/RockField'
import { TreeField } from '@/three/models/TreeField'
import { LaunchComplex } from '@/three/models/LaunchComplex'
import { LaunchRail } from '@/three/models/LaunchRail'
import { ScorchDecal } from '@/three/models/ScorchDecal'
import { ControlConsole } from '@/three/models/ControlConsole'
import { FlyingMesange } from '@/three/models/FlyingMesange'
import { SceneReadySignal } from '@/three/models/SceneReadySignal'
import { RocketInfoHologram } from '@/three/models/RocketInfoHologram'
import { VisibilityCorridor } from '@/three/models/VisibilityCorridor'
import {
  CORRIDOR_DECOY_LINE_WIDTH,
  CORRIDOR_DECOY_MIN_SPACING,
  CORRIDOR_DECOY_MAX_POINTS,
  CORRIDOR_DECOY_PUBLISH_SEC,
} from '@/three/constants/visibilityCorridor'
import { SceneRadar } from '@/three/models/SceneRadar'
import { EnvironmentSky } from './EnvironmentSky'
import { SunMesh } from './SunMesh'
import { SunLight } from './SunLight'
import { FreezeShadows } from './FreezeShadows'
import { ExposureController } from './ExposureController'
import { LaunchCameraControls } from './LaunchCameraControls'
import { PAD_TOP_Y } from '@/three/constants/launchComplex'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { DAYLIGHT_EXPOSURE } from '@/three/constants/launchDaylight'
import { NIGHT_FOG_COLOR } from '@/three/constants/launchNight'
import { DETAIL_RADIUS, FAR_GROUND_RADIUS } from '@/lib/sceneScale'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'
import type { MesangeFlightPlan } from '@/lib/buildFleetFlightPlan'
import type { RadarConfig } from '@/types/radar.types'
import type { SceneMode, CameraMode } from '@/types/scene.types'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

/** Un radar à afficher dans la scène : sa config + son décalage scène calculé. */
export interface RadarInScene {
  id: string
  config: RadarConfig
  offset: SceneOffset
}

export interface LaunchSceneCanvasProps {
  radars: RadarInScene[]
  launchEnabled: boolean
  onLaunch: () => void
  inclinationDeg: number
  azimuthDeg: number
  flying: boolean
  /** Plan de vol de TOUTE la flotte (Roi + leurres) — voir buildFleetFlightPlan.
   *  Vide tant que le backend n'a pas répondu (aucun vol à rendre). */
  flightPlan: MesangeFlightPlan[]
  flightProgressRef?: React.RefObject<number>
  /** Impact réel de la fusée (fin de la chute sur le relief 3D) — voir
   *  useTrajectoryPlayback. Signal DÉCLENCHEUR de la fin de vol côté séquence,
   *  au lieu d'une durée devinée à l'avance (voir useLaunchSequence). */
  onImpact?: () => void
  /** Scène 3D montée (GLB radars/mésange chargés) — voir SceneReadySignal. */
  onSceneReady?: () => void
  /** Mètres réels → unités scène (map fixe, voir computeSceneScale). */
  metersPerSceneUnit: number
  /** Portée max estimée du missile (km), null tant que non reçue — voir RocketInfoHologram. */
  rangeKm: number | null
  /** Libellé du rôle de la menace principale (Roi/Leurre) — voir RocketInfoHologram. */
  roleLabel: string
  /** Site + radars géo-positionnés (lat/lng réels) — nécessaires pour classer
   *  la visibilité de la trajectoire par radar (voir VisibilityCorridor).
   *  Distinct de `radars` ci-dessus (offsets scène, pour le rendu 3D). */
  site: LaunchSite
  placedRadars: PlacedRadar[]
  mode?: SceneMode
  /** Mode de caméra pendant le vol (suivi King / vue radar / vue large). */
  cameraMode?: CameraMode
  className?: string
  /** Renderer prêt : sert à brancher la récupération de contexte WebGL (useCanvasRecovery). */
  onGlReady?: (gl: THREE.WebGLRenderer) => void
}

// Couleur du fog — gris à PEINE réchauffé (avant `#d9b98a`, un beige-orange
// FRANC qui teintait tout l'horizon en orange sale, le « voile dégueulasse »
// signalé). Désaturé : le fog fond le lointain SANS imposer sa couleur à tout
// l'air ni au ciel. Reste un soupçon chaud pour rester cohérent golden hour.
const FOG_COLOR = '#c2c0bb'

// Densité du fog exponentiel ENCORE réduite (0.9 → 0.5 / DETAIL_RADIUS) : à
// cette valeur, seul le tout-dernier plan (bord du monde) se fond ; l'air et
// le ciel restent nets, plus de voile permanent sur toute la scène.
const FOG_DENSITY = 0.5 / DETAIL_RADIUS

// Demi-étendue de la shadow-camera (unités) : resserrée sur le pad (demi-côté
// max ~42, cf. PAD_TIERS) + rampe/console/arbres immédiats — texel net là où
// l'œil regarde le plus (2·200/4096 ≈ 0.1u). Au-delà, pas d'ombre portée fine
// — masqué par le fog/la distance, coût nul.
const SHADOW_RADIUS = 200


export function LaunchSceneCanvas({
  radars,
  launchEnabled,
  onLaunch,
  inclinationDeg,
  azimuthDeg,
  flying,
  flightPlan,
  flightProgressRef,
  onImpact,
  onSceneReady,
  metersPerSceneUnit,
  rangeKm,
  roleLabel,
  site,
  placedRadars,
  mode = 'day',
  cameraMode = 'follow',
  className,
  onGlReady,
}: LaunchSceneCanvasProps) {
  // Position monde du ROI en vol, partagée avec la caméra de suivi et le
  // corridor de visibilité. Seul le King pilote la caméra 3D ; les leurres se
  // suivent sur la carte tactique (voir LaunchTacticalMap).
  const rocketPos = useRef<THREE.Vector3 | null>(null)
  // Position LOCALE live du Roi (repère du groupe pad) — alimente le
  // corridor de visibilité (voir VisibilityCorridor), toujours une instance
  // valide (jamais null) pour une lecture sans garde côté hook.
  const corridorPosRef = useRef(new THREE.Vector3())
  // Position LOCALE live de CHAQUE leurre (Dame/Pion), par id — alimente son
  // propre corridor de visibilité (plus fin que celui du Roi). Map STABLE
  // (une seule instance sur la vie du composant) : on récupère/crée la ref du
  // leurre à la volée dans son onFlightFrame, sans re-render.
  const decoyPosRefs = useRef(new Map<string, React.RefObject<THREE.Vector3>>())
  const getDecoyPosRef = (id: string): React.RefObject<THREE.Vector3> => {
    const map = decoyPosRefs.current
    let ref = map.get(id)
    if (!ref) {
      ref = { current: new THREE.Vector3() }
      map.set(id, ref)
    }
    return ref
  }
  // Compteur d'écritures de position, par menace (et pour le Roi) : incrémenté à
  // CHAQUE onFlightFrame. Le corridor ne consomme une position que si ce compteur
  // a bougé — sans quoi il accumulait, pendant les 1-2 frames où la Mesange n'est
  // pas encore montée, une position périmée (l'impact du vol PRÉCÉDENT au replay,
  // ces refs n'étant jamais purgées). Voir la garde dans useCorridorPoints.
  const kingWriteCount = useRef(0)
  const decoyWriteCounts = useRef(new Map<string, React.RefObject<number>>())
  const getDecoyWriteCount = (id: string): React.RefObject<number> => {
    const map = decoyWriteCounts.current
    let ref = map.get(id)
    if (!ref) {
      ref = { current: 0 }
      map.set(id, ref)
    }
    return ref
  }
  // Mesh du soleil (voir SunMesh) : source de l'effet God Rays (PostFX).
  const sunMeshRef = useRef<THREE.Mesh>(null)
  // Distance scène du radar le plus éloigné : cadre la caméra et sa portée de zoom.
  const radarDistance = Math.max(0, ...radars.map((r) => r.offset.sceneRadius))
  const maxDistance = Math.max(600, radarDistance * 1.5)

  // Origine ET orientation du vol du ROI = pile la pose réelle de la fusée
  // sur la rampe inclinée/orientée (mêmes formules géométriques que
  // LaunchRail) — un point fixe indépendant de l'inclinaison/azimut causait
  // un « pop » visuel (saut de position/orientation) au moment du décollage.
  // La rampe VISUELLE (LaunchRail/RocketInfoHologram/VisibilityCorridor) reste
  // unique et pilotée par le Roi — un seul pas de tir physique dans la scène.
  const railOrigin = useMemo(
    () => computeRailRocketOrigin(inclinationDeg, azimuthDeg),
    [inclinationDeg, azimuthDeg],
  )

  // Origine/direction de CHAQUE Mesange de la flotte (même géométrie de
  // rampe que le Roi, un azimut/élévation différents suffisent en général à
  // les distinguer) + un LÉGER offset latéral déterministe par index — évite
  // la superposition visuelle exacte quand deux Mesange partagent le même
  // azimut/élévation (ex. deux Pions réglés à l'identique).
  const fleetOrigins = useMemo(
    () =>
      flightPlan.map(({ config }, index) => {
        const origin = computeRailRocketOrigin(config.inclinationDeg, config.azimuthDeg)
        if (index === 0) return origin
        // Décale perpendiculairement à l'axe du fût (le plan XZ de la rampe),
        // en alternant de part et d'autre pour que les offsets ne s'alignent
        // pas tous du même côté.
        const side = index % 2 === 0 ? 1 : -1
        const magnitude = 0.6 * Math.ceil(index / 2)
        const perpendicular = new THREE.Vector3(-origin.direction.z, 0, origin.direction.x).normalize()
        return {
          position: origin.position.clone().addScaledVector(perpendicular, side * magnitude),
          direction: origin.direction,
        }
      }),
    [flightPlan],
  )

  // Position de départ de la caméra : TOUJOURS derrière la fusée, quel que
  // soit l'azimut de tir (voir computeLaunchCameraStart) — figée au montage
  // (le <Canvas> n'applique le prop `camera` qu'à la création, l'utilisateur
  // orbite ensuite librement sans jamais être ramené ici).
  const cameraStart = useMemo(() => computeLaunchCameraStart(azimuthDeg), [azimuthDeg])

  // Étiquette d'altitude live du ROI (voir KingAltitudeTag) : réservée à la
  // caméra de SUIVI — c'est le seul mode où l'on est assez près pour lire un
  // chiffre collé à la fusée (en vue radar/large elle n'est qu'un point). Les
  // altitudes viennent de la trajectoire du Roi, la seule vraie source (RocketPy).
  const kingAltitudeTag = useMemo(() => {
    const king = flightPlan.find((plan) => plan.isKing)
    if (!king || cameraMode !== 'follow' || !flightProgressRef) return undefined
    return { progressRef: flightProgressRef, altitudesM: king.flight.trajectory.map((p) => p.z) }
  }, [flightPlan, cameraMode, flightProgressRef])


  return (
    <Canvas
      className={className}
      // Ombres douces FIGÉES (voir FreezeShadows) : le shadow pass ne tourne
      // que quelques frames après (re)chargement, puis les ombres sont
      // gratuites — testé isolément non fautif (crash venait du CUMUL avec
      // herbe/rochers/arbres à pleine charge simultanée).
      shadows="soft"
      // Résolution : plafond ABAISSÉ (2 → 1.5). À dpr=2 on rend 4× les pixels
      // d'un écran 1×, cumulé à l'AO + God Rays plein écran → chute à ~4 FPS sur
      // le GPU AMD, d'où la fusée qui avançait PAR BONDS. 1.5 divise la charge
      // de rasterisation par ~1.8 pour une netteté quasi identique à l'œil.
      // Priorité fluidité (60 FPS stable), voir feedback_gpu_budget.
      dpr={[1, PHOTO_MODE ? PHOTO_DPR_MAX : 1.25]}
      gl={{
        // AA natif coupé QUAND le post-traitement tourne : celui-ci rend hors
        // écran et fait l'anti-aliasing en SMAA (voir PostFX, `multisampling={0}`).
        // Laisser `antialias: true` faisait allouer et remplir un framebuffer
        // MSAA que le composer n'échantillonne jamais — coût de fill payé pour
        // rien à chaque frame, sans différence visible.
        // Reste lié au flag : si POSTFX_ENABLED retombe à false (secours driver),
        // le MSAA natif redevient la SEULE source d'AA et doit revenir.
        antialias: !POSTFX_ENABLED,
        powerPreference: 'high-performance',
        // AgX (remplace ACESFilmic) : courbe filmique moderne qui écrase les
        // hautes lumières en DOUCEUR (roll-off progressif) au lieu de les
        // clipper au blanc — c'est ce qui faisait « flasher » le ciel/soleil
        // avec ACES. Rendu plus doux et plus riche en dégradés dans les
        // hautes valeurs, sans changer l'éclairage de la scène.
        toneMapping: THREE.AgXToneMapping,
        toneMappingExposure: DAYLIGHT_EXPOSURE,
      }}
      onCreated={({ gl }) => {
        gl.shadowMap.autoUpdate = false
        gl.shadowMap.needsUpdate = true
        onGlReady?.(gl)
      }}
      camera={{ position: cameraStart, fov: 55, near: 1, far: FAR_GROUND_RADIUS * 2.2 }}
    >
      {/* Libère le contexte WebGL au démontage (voir GlContextReleaser) :
          empêche l'accumulation de contextes orphelins → « Context Lost ». */}
      <GlContextReleaser />

      {/* Mesure des perfs (draw calls / triangles / ms GPU) — éteint par
          défaut, voir PERF_HUD_ENABLED. Le composant décide seul de ne rien
          rendre : à allumer le temps d'un diagnostic de chute de FPS. */}
      <PerfHud />

      {/* Ciel + IBL depuis une vraie HDRI golden hour (fond, nuages, halo
          solaire réels + reflets sur les matériaux PBR) — voir EnvironmentSky.
          Suspense LOCAL : le chargement (réseau/disque) ne doit jamais
          blanchir le reste de la scène en attendant. */}
      <Suspense fallback={null}>
        <EnvironmentSky mode={mode} />
      </Suspense>
      {/* Brume de distance EXPONENTIELLE (FogExp2) : densité croissante en
          douceur avec la distance, pas de bornes near/far linéaires — sans
          ce dégradé, la caméra de suivi (translation rigide avec la fusée,
          voir useOrbitTargetFollow) sortait vite de la fenêtre [near,far] en
          montant, et ne voyait plus qu'un sol plat uniformément « pris »
          dans le fog, sans transition. FOG_DENSITY calée sur DETAIL_RADIUS :
          la zone détaillée (pad, herbe, arbres) reste nette, le sol lointain
          se fond progressivement dans la couleur d'horizon de l'HDRI. */}
      <fogExp2 attach="fog" args={[mode === 'night' ? NIGHT_FOG_COLOR : FOG_COLOR, FOG_DENSITY]} />

      {/* Soleil golden hour + hémisphérique, synchronisé avec le ciel (DaylightSky) :
          direction dérivée de la même source (SKY.elevationDeg/azimuthDeg) via
          getSunDirection(). Shadow-camera restreinte à la zone RAPPROCHÉE du pad
          (pas DETAIL_RADIUS entier, 4000 unités noierait les 2048² texels en
          gros blocs flous) — couvre le pad + le décor dense proche (herbe/arbres),
          net là où l'œil regarde ; le reste se fond dans le fog sans ombre fine. */}
      <SunLight shadowRadius={SHADOW_RADIUS} mode={mode} />
      {/* Mesh du soleil : source de l'effet God Rays (voir PostFX/SunMesh). */}
      <SunMesh ref={sunMeshRef} />
      {/* Ré-cuit la shadow map quand la rampe se réoriente ou qu'un vol
          démarre/s'arrête (sinon l'ombre resterait figée dans l'ancienne
          pose) : quelques frames de shadow pass, puis regel — coût quasi nul. */}
      <FreezeShadows resetKey={`${inclinationDeg}:${azimuthDeg}:${flying}:${mode}`} />

      {/* Applique l'exposition selon l'ambiance (jour/nuit) — la valeur du
          Canvas n'étant lue qu'à la création, la bascule ☀/☾ passe par ici. */}
      <ExposureController mode={mode} />

      {/* Sol fixe en relief (source de vérité : sampleGroundHeight). */}
      <GroundMesh />

      {/* Anneau de collines silhouette à l'horizon : casse la ligne plate du
          sol lointain (voir FarHorizon), coût quasi nul (statique, low-poly). */}
      <FarHorizon mode={mode} />

      {/* Bande de brume atmosphérique à l'horizon (voir HorizonHaze) : avale
          la ligne de coupure du paysage lointain, dégradé dense au sol → clair
          en altitude, bruit organique qui dérive lentement (pas de sprites
          « nuages » qui trahissent leur nature de billboard de près). */}
      <HorizonHaze mode={mode} />

      {/* Couche de nuages VOLUMÉTRIQUES à l'altitude réelle de cumulus (2 km, voir
          VolumetricClouds) : raymarching court dans une tranche bornée, la fusée
          les traverse en montant — vrais nuages 3D, pas le fond HDRI plat.
          Désactivable d'un flag (VOLUMETRIC_CLOUDS_ENABLED) si le driver AMD
          faiblit.

          MAINTENUS PENDANT LE VOL : ils y étaient coupés (`!flying`) par
          l'allègement dynamique du commit bde99f4, quand le FPS tombait à ~4 et
          faisait avancer la fusée par bonds. Ce garde-fou n'a plus lieu d'être
          (règle 60 FPS levée, rendu maximal voulu — cf. feedback_gpu_budget) et
          il annulait justement leur intérêt : traversés en montée, les nuages
          sont le seul jalon d'altitude naturel de la scène. C'était d'ailleurs le
          DERNIER allègement en vol encore actif, les autres ayant déjà été
          retirés depuis. */}
      {VOLUMETRIC_CLOUDS_ENABLED && mode !== 'night' && (
        <VolumetricClouds metersPerSceneUnit={metersPerSceneUnit} />
      )}

      {/* Herbe 3D (streaming par tuiles autour de la caméra) + rochers + arbres semés. */}
      <GrassField />
      <RockField terrainRadius={DETAIL_RADIUS} />
      <TreeField terrainRadius={DETAIL_RADIUS} />

      {/* Pas de tir : plateforme béton à gradins + rampe + console + fusée. Le
          pad est dans la zone plate du sol (sampleGroundHeight = 0 pile à
          l'origine), posé directement sans relèvement. Suspense : les modèles
          GLTF (radars, mésange) suspendent au chargement à froid — sans lui, la
          suspension remonte jusqu'à la route et blanchit brièvement l'écran ; un
          échec de chargement est capté par le SceneErrorBoundary parent. */}
      <Suspense fallback={null}>
      {onSceneReady && <SceneReadySignal onReady={onSceneReady} />}
      <group position={LAUNCH_CENTER}>
        <LaunchComplex />
        <group position={[0, PAD_TOP_Y, 0]}>
          <ScorchDecal launched={flying} />
          <LaunchRail inclinationDeg={inclinationDeg} azimuthDeg={azimuthDeg} launched={flying} />
          <ControlConsole launchEnabled={launchEnabled} onLaunch={onLaunch} />
          {/* Fiche technique du missile : visible en phase armée seulement,
              disparaît au décollage (voir RocketInfoHologram). */}
          {launchEnabled && (
            <RocketInfoHologram
              origin={railOrigin.position}
              elevationDeg={inclinationDeg}
              azimuthDeg={azimuthDeg}
              rangeKm={rangeKm}
              roleLabel={roleLabel}
            />
          )}
          {/* Une FlyingMesange par membre de la flotte (Roi + leurres) — voir
              buildFleetFlightPlan. Seul le ROI pilote la caméra (suivi 3D),
              remonte sa position (corridor de visibilité) et déclenche onImpact
              (signal de fin de séquence, voir useLaunchSequence) — les leurres
              jouent leur animation/impact visuel en 3D sans piloter la séquence
              (ils se suivent en détail sur la carte tactique, voir
              LaunchTacticalMap). */}
          {flightPlan.map((plan, index) => (
            <FlyingMesange
              key={plan.config.id}
              flight={plan.flight}
              origin={fleetOrigins[index].position}
              initialDirection={fleetOrigins[index].direction}
              active={flying}
              metersPerSceneUnit={metersPerSceneUnit}
              detail={plan.isKing ? 'full' : 'lite'}
              role={plan.config.role}
              launchDelaySec={plan.config.launchDelaySec}
              onFlightFrame={
                plan.isKing
                  ? (p, progress) => {
                      if (!rocketPos.current) rocketPos.current = new THREE.Vector3()
                      rocketPos.current.set(p.x, p.y + PAD_TOP_Y, p.z)
                      corridorPosRef.current.copy(p)
                      kingWriteCount.current += 1
                      if (flightProgressRef) flightProgressRef.current = progress
                    }
                  : // Leurres : on n'écrit QUE leur position live (pour leur
                    // corridor) — ni caméra, ni progression globale, ni impact
                    // (réservés au Roi, voir plus haut).
                    (p) => {
                      getDecoyPosRef(plan.config.id).current.copy(p)
                      getDecoyWriteCount(plan.config.id).current += 1
                    }
              }
              onImpact={plan.isKing ? onImpact : undefined}
              altitudeTag={plan.isKing ? kingAltitudeTag : undefined}
            />
          ))}
          {/* Corridor de visibilité du ROI : la fusée réellement rendue, suivie
              EN DIRECT (voir VisibilityCorridor) — jamais démonté, pour ne
              jamais perdre le corridor accumulé entre deux re-renders ; il
              reste vide/masqué tant qu'aucun vol n'a commencé. */}
          <VisibilityCorridor
            site={site}
            radars={placedRadars}
            active={flying}
            armed={launchEnabled}
            origin={railOrigin.position}
            metersPerSceneUnit={metersPerSceneUnit}
            positionRef={corridorPosRef}
            writeCountRef={kingWriteCount}
          />
          {/* Corridor de visibilité de CHAQUE leurre (Dame/Pion), PLUS FIN que
              le Roi : même logique (vu/aveugle le long du vol réel), mappée sur
              la trajectoire propre du leurre via son origine de rampe et sa
              position live dédiée. La menace réelle (Roi) reste visuellement
              prioritaire grâce au trait plus épais. */}
          {flightPlan.map((plan, index) =>
            plan.isKing ? null : (
              <VisibilityCorridor
                key={`corridor-${plan.config.id}`}
                site={site}
                radars={placedRadars}
                active={flying}
                armed={launchEnabled}
                origin={fleetOrigins[index].position}
                metersPerSceneUnit={metersPerSceneUnit}
                positionRef={getDecoyPosRef(plan.config.id)}
                writeCountRef={getDecoyWriteCount(plan.config.id)}
                lineWidth={CORRIDOR_DECOY_LINE_WIDTH}
                minPointSpacing={CORRIDOR_DECOY_MIN_SPACING}
                maxPoints={CORRIDOR_DECOY_MAX_POINTS}
                publishIntervalSec={CORRIDOR_DECOY_PUBLISH_SEC}
              />
            ),
          )}
        </group>

        {radars.map((radar) => (
          <SceneRadar key={radar.id} config={radar.config} offset={radar.offset} />
        ))}
      </group>
      </Suspense>

      {/* Caméra à 3 modes commutables en vol (suivi King / vue radar / vue
          large fixe — voir LaunchCameraControls + CameraMode). En 'follow' :
          orbite libre, suit le King, retour doux au pad à la fin. */}
      <LaunchCameraControls
        rocketRef={rocketPos}
        flying={flying}
        armed={launchEnabled}
        maxDistance={maxDistance}
        mode={cameraMode}
        radarScene={radars[0] ? { x: radars[0].offset.x, z: radars[0].offset.z } : null}
        frameRadius={radarDistance}
      />

      {/* Post-processing : ALLÉGÉ DYNAMIQUEMENT EN VOL. Au sol (armement) on
          garde la chaîne complète (POSTFX_QUALITY) pour une belle scène ; dès
          que la fusée vole, on retombe sur SMAA SEUL (plus d'AO ni Bloom plein
          écran) — ce sont ces passes qui plombaient le FPS pendant le vol (46
          FPS mesuré → fusée par bonds). SMAA seul + les autres allègements
          visent 70 FPS constant PENDANT LE VOL, moment où la fluidité compte.
          Voir feedback_gpu_budget (priorité fluidité en vol). */}
      {/* En MODE PHOTO la chaîne complète est maintenue même en vol : l'allègement
          à SMAA seul protège le FPS pendant le tir, mais on veut justement l'AO,
          les god rays et le bloom sur une capture de la fusée en l'air. */}
      {POSTFX_ENABLED && (
        <PostFX quality={flying && !PHOTO_MODE ? 'smaa' : POSTFX_QUALITY} sunRef={sunMeshRef} />
      )}

      {/* Compteur FPS (développement uniquement) : mesure avant/après chaque
          réglage graphique — budget cible 60 FPS. */}
      {import.meta.env.DEV && <Stats />}
    </Canvas>
  )
}
