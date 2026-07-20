import { Suspense, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import * as THREE from 'three'
import { computeRailRocketOrigin } from '@/lib/computeRailRocketOrigin'
import { computeLaunchCameraStart } from '@/lib/computeLaunchCameraStart'
import { GlContextReleaser } from './GlContextReleaser'
import { PostFX } from './PostFX'
import { POSTFX_ENABLED, POSTFX_QUALITY } from '@/three/constants/postFx'
import { GroundMesh } from '@/three/models/GroundMesh'
import { GrassField } from '@/three/models/GrassField'
import { RockField } from '@/three/models/RockField'
import { TreeField } from '@/three/models/TreeField'
import { LaunchComplex } from '@/three/models/LaunchComplex'
import { LaunchRail } from '@/three/models/LaunchRail'
import { ScorchDecal } from '@/three/models/ScorchDecal'
import { ControlConsole } from '@/three/models/ControlConsole'
import { FlyingMesange } from '@/three/models/FlyingMesange'
import { RocketInfoHologram } from '@/three/models/RocketInfoHologram'
import { VisibilityCorridor } from '@/three/models/VisibilityCorridor'
import { SceneRadar } from '@/three/models/SceneRadar'
import { EnvironmentSky } from './EnvironmentSky'
import { SunMesh } from './SunMesh'
import { SunLight } from './SunLight'
import { FreezeShadows } from './FreezeShadows'
import { LaunchCameraControls } from './LaunchCameraControls'
import { PAD_TOP_Y } from '@/three/constants/launchComplex'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { DAYLIGHT_EXPOSURE } from '@/three/constants/launchDaylight'
import { DETAIL_RADIUS, FAR_GROUND_RADIUS } from '@/lib/sceneScale'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'
import type { RadarConfig } from '@/types/radar.types'
import type { SceneMode } from '@/types/scene.types'
import type { FlightData } from '@/lib/api'
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
  flight: FlightData | null
  flightProgressRef?: React.RefObject<number>
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
  className?: string
  /** Renderer prêt : sert à brancher la récupération de contexte WebGL (useCanvasRecovery). */
  onGlReady?: (gl: THREE.WebGLRenderer) => void
}

// Couleur du fog (horizon golden hour) — proche de la teinte d'horizon du
// ciel Preetham à cette élévation solaire, pour que le bord du sol se fonde
// dedans sans à-coup de couleur (plus de « mur » net au bout du monde).
const FOG_COLOR = '#d9b98a'

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
  flight,
  flightProgressRef,
  metersPerSceneUnit,
  rangeKm,
  roleLabel,
  site,
  placedRadars,
  className,
  onGlReady,
}: LaunchSceneCanvasProps) {
  // Position monde de la fusée en vol, partagée avec la caméra de suivi.
  const rocketPos = useRef<THREE.Vector3 | null>(null)
  // Position LOCALE live de la fusée (repère du groupe pad) — alimente le
  // corridor de visibilité (voir VisibilityCorridor), toujours une instance
  // valide (jamais null) pour une lecture sans garde côté hook.
  const corridorPosRef = useRef(new THREE.Vector3())
  // Mesh du soleil (voir SunMesh) : source de l'effet God Rays (PostFX).
  const sunMeshRef = useRef<THREE.Mesh>(null)
  // Distance scène du radar le plus éloigné : cadre la caméra et sa portée de zoom.
  const radarDistance = Math.max(0, ...radars.map((r) => r.offset.sceneRadius))
  const maxDistance = Math.max(600, radarDistance * 1.5)

  // Origine ET orientation du vol = pile la pose réelle de la fusée sur la
  // rampe inclinée/orientée (mêmes formules géométriques que LaunchRail) — un
  // point fixe indépendant de l'inclinaison/azimut causait un « pop » visuel
  // (saut de position/orientation) au moment du décollage.
  const railOrigin = useMemo(
    () => computeRailRocketOrigin(inclinationDeg, azimuthDeg),
    [inclinationDeg, azimuthDeg],
  )

  // Position de départ de la caméra : TOUJOURS derrière la fusée, quel que
  // soit l'azimut de tir (voir computeLaunchCameraStart) — figée au montage
  // (le <Canvas> n'applique le prop `camera` qu'à la création, l'utilisateur
  // orbite ensuite librement sans jamais être ramené ici).
  const cameraStart = useMemo(() => computeLaunchCameraStart(azimuthDeg), [azimuthDeg])

  return (
    <Canvas
      className={className}
      // Ombres douces FIGÉES (voir FreezeShadows) : le shadow pass ne tourne
      // que quelques frames après (re)chargement, puis les ombres sont
      // gratuites — testé isolément non fautif (crash venait du CUMUL avec
      // herbe/rochers/arbres à pleine charge simultanée).
      shadows="soft"
      dpr={[1, 1.25]}
      gl={{
        antialias: false,
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

      {/* Ciel + IBL depuis une vraie HDRI golden hour (fond, nuages, halo
          solaire réels + reflets sur les matériaux PBR) — voir EnvironmentSky.
          Suspense LOCAL : le chargement (réseau/disque) ne doit jamais
          blanchir le reste de la scène en attendant. */}
      <Suspense fallback={null}>
        <EnvironmentSky />
      </Suspense>
      {/* Brume de distance : nette sur la zone détaillée, dissout le sol plat
          lointain dans la couleur d'horizon de l'HDRI (horizon doux). */}
      <fog attach="fog" args={[FOG_COLOR, DETAIL_RADIUS * 1.2, FAR_GROUND_RADIUS * 0.5]} />

      {/* Soleil golden hour + hémisphérique, synchronisé avec le ciel (DaylightSky) :
          direction dérivée de la même source (SKY.elevationDeg/azimuthDeg) via
          getSunDirection(). Shadow-camera restreinte à la zone RAPPROCHÉE du pad
          (pas DETAIL_RADIUS entier, 4000 unités noierait les 2048² texels en
          gros blocs flous) — couvre le pad + le décor dense proche (herbe/arbres),
          net là où l'œil regarde ; le reste se fond dans le fog sans ombre fine. */}
      <SunLight shadowRadius={SHADOW_RADIUS} />
      {/* Mesh du soleil : source de l'effet God Rays (voir PostFX/SunMesh). */}
      <SunMesh ref={sunMeshRef} />
      {/* Ré-cuit la shadow map quand la rampe se réoriente ou qu'un vol
          démarre/s'arrête (sinon l'ombre resterait figée dans l'ancienne
          pose) : quelques frames de shadow pass, puis regel — coût quasi nul. */}
      <FreezeShadows resetKey={`${inclinationDeg}:${azimuthDeg}:${flying}`} />

      {/* Sol fixe en relief (source de vérité : sampleGroundHeight). */}
      <GroundMesh />

      {/* Herbe 3D (streaming par tuiles autour de la caméra) + rochers + arbres semés. */}
      <GrassField />
      <RockField terrainRadius={DETAIL_RADIUS} />
      <TreeField />

      {/* Pas de tir : plateforme béton à gradins + rampe + console + fusée. Le
          pad est dans la zone plate du sol (sampleGroundHeight = 0 pile à
          l'origine), posé directement sans relèvement. Suspense : les modèles
          GLTF (radars, mésange) suspendent au chargement à froid — sans lui, la
          suspension remonte jusqu'à la route et blanchit brièvement l'écran ; un
          échec de chargement est capté par le SceneErrorBoundary parent. */}
      <Suspense fallback={null}>
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
          <FlyingMesange
            flight={flight}
            origin={railOrigin.position}
            initialDirection={railOrigin.direction}
            active={flying}
            metersPerSceneUnit={metersPerSceneUnit}
            onFlightFrame={(p, progress) => {
              if (!rocketPos.current) rocketPos.current = new THREE.Vector3()
              rocketPos.current.set(p.x, p.y + PAD_TOP_Y, p.z)
              corridorPosRef.current.copy(p)
              if (flightProgressRef) flightProgressRef.current = progress
            }}
          />
          {/* Corridor de visibilité : la fusée réellement rendue, suivie EN
              DIRECT (voir VisibilityCorridor/useVisibilityCorridorTrail) —
              jamais démonté, pour ne jamais perdre le corridor accumulé entre
              deux re-renders ; il reste vide/masqué tant qu'aucun vol n'a
              commencé. */}
          <VisibilityCorridor
            site={site}
            radars={placedRadars}
            active={flying}
            armed={launchEnabled}
            origin={railOrigin.position}
            metersPerSceneUnit={metersPerSceneUnit}
            positionRef={corridorPosRef}
          />
        </group>

        {radars.map((radar) => (
          <SceneRadar key={radar.id} config={radar.config} offset={radar.offset} />
        ))}
      </group>
      </Suspense>

      {/* Caméra UNIQUE : orbite libre en permanence (même en vol). Pendant le
          vol, la cible suit la fusée ; à la fin, retour doux vers le pad. */}
      <LaunchCameraControls
        rocketRef={rocketPos}
        flying={flying}
        armed={launchEnabled}
        maxDistance={maxDistance}
      />

      {/* Post-processing léger (Bloom fait rayonner le soleil/les surfaces
          claires + SMAA obligatoire, l'AA natif étant coupé) : garde-fou FPS
          via POSTFX_QUALITY, à repasser en 'smaa' si le FPS chute. */}
      {POSTFX_ENABLED && <PostFX quality={POSTFX_QUALITY} sunRef={sunMeshRef} />}

      {/* Compteur FPS (développement uniquement) : mesure avant/après chaque
          réglage graphique — budget cible 60 FPS. */}
      {import.meta.env.DEV && <Stats />}
    </Canvas>
  )
}
