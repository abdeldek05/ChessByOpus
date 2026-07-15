import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import * as THREE from 'three'
import { DaylightSky } from './DaylightSky'
import { NightSky } from './NightSky'
import { SunLight } from './SunLight'
import { MoonLight } from './MoonLight'
import { SceneTone } from './SceneTone'
import { SkyDome } from './SkyDome'
import { AltitudeFog } from './AltitudeFog'
import { OutdoorEnvironment } from './OutdoorEnvironment'
import { FreezeShadows } from './FreezeShadows'
import { LaunchCameraControls } from './LaunchCameraControls'
import { PostFX } from './PostFX'
import { UnifiedTerrain } from '@/three/models/UnifiedTerrain'
import { CloudLayer } from '@/three/models/CloudLayer'
import { GrassField } from '@/three/models/GrassField'
import { CactusField } from '@/three/models/CactusField'
import { OasisPatch } from '@/three/models/OasisPatch'
import { DryScrubField } from '@/three/models/DryScrubField'
import { RockField } from '@/three/models/RockField'
import { LaunchComplex } from '@/three/models/LaunchComplex'
import { PAD_TOP_Y } from '@/three/constants/launchComplex'
import { AtmosphereParticles } from '@/three/models/AtmosphereParticles'
import { LaunchRail } from '@/three/models/LaunchRail'
import { ScorchDecal } from '@/three/models/ScorchDecal'
import { SceneRadar } from '@/three/models/SceneRadar'
import { ControlConsole } from '@/three/models/ControlConsole'
import { FlyingMesange } from '@/three/models/FlyingMesange'
import { computePadLift } from '@/lib/padGroundLift'
import {
  DAYLIGHT_BACKGROUND,
  DAYLIGHT_EXPOSURE,
  FOG_COLOR,
  FOG_NEAR_FRAC,
  FOG_FAR_FRAC,
  SKY_GRADIENT,
} from '@/three/constants/launchDaylight'
import { NIGHT_FOG_COLOR } from '@/three/constants/launchNight'
import { DESERT_FOG_COLOR } from '@/three/constants/desertField'
import { POSTFX_ENABLED, POSTFX_QUALITY } from '@/three/constants/postFx'
import type { SceneMode, SceneBiome } from '@/types/scene.types'
import {
  LAUNCH_CENTER,
  CAMERA_POSITION,
  TERRAIN_EDGE_RADIUS,
  METERS_PER_SCENE_UNIT,
  SHADOW_COVERAGE_RADIUS,
} from '@/three/constants/sceneLayout'
import { TERRAIN_OUTER_MARGIN } from '@/three/constants/terrainMesh'
import type { RadarConfig } from '@/types/radar.types'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'
import type { FlightData } from '@/lib/api'

/** Un radar à afficher dans la scène : sa config + son décalage scène calculé. */
export interface RadarInScene {
  id: string
  config: RadarConfig
  offset: SceneOffset
}

interface LaunchSceneCanvasProps {
  /** Radars placés (1-2), tous rendus à leur direction réelle. */
  radars: RadarInScene[]
  launchEnabled: boolean
  onLaunch: () => void
  /** Menace principale (Roi) : incline la rampe et l'oriente. */
  inclinationDeg: number
  azimuthDeg: number
  /** Vol en cours : la Mesange quitte la rampe et suit sa trajectoire. */
  flying: boolean
  /** Vraie trajectoire RocketPy à rejouer (null tant que non calculée). */
  flight: FlightData | null
  /** Ref partagée écrite à chaque frame de vol : progression 0→1 de la
   *  trajectoire. Lue par la Tactical View (boucle rAF) pour dessiner la piste
   *  en direct SANS re-render React. -1 = pas de vol en cours. */
  flightProgressRef?: React.RefObject<number>
  /** Ambiance de la scène : jour (golden hour) ou nuit (lune + étoiles). */
  mode?: SceneMode
  /** Biome du décor selon le site : prairie (défaut) ou désert (midāna). */
  biome?: SceneBiome
  className?: string
}

// Recul caméra initial : distance FIXE, bornée à la zone proche détaillée. À
// l'échelle de la scène (METERS_PER_SCENE_UNIT, sceneLayout.ts), radarDistance
// peut valoir des dizaines de milliers d'unités (radar à 50-60 km) — la caméra
// ne doit JAMAIS partir de là au repos, sinon elle ne voit plus que le sol
// lointain uniforme (le pas de tir devient un point invisible). Le radar
// lointain reste visible via la carte tactique 2D ou en dézoomant manuellement
// (maxDistance suit farDistance, voir plus bas).
const INITIAL_CAMERA_DIST = 32

export function LaunchSceneCanvas({
  radars,
  launchEnabled,
  onLaunch,
  inclinationDeg,
  azimuthDeg,
  flying,
  flight,
  flightProgressRef,
  mode = 'day',
  biome = 'meadow',
  className,
}: LaunchSceneCanvasProps) {
  const night = mode === 'night'
  const desert = biome === 'desert'
  // Relèvement du pas de tir au-dessus du relief réel sous son emprise — même
  // formule que la collision (sampleSceneGround/computePadLift), pour que la
  // dalle visible ne se retrouve jamais sous le terrain qui l'entoure.
  const padLift = computePadLift(biome)
  // Origine du vol = sommet de rampe, LOCALE au groupe surélevé (déjà décalé de
  // PAD_TOP_Y) → juste +4. La trajectoire RocketPy est rejouée à partir de là.
  const flightOrigin = new THREE.Vector3(0, 4, 0)
  // Position monde de la fusée en vol, partagée avec la caméra de suivi. Le vol
  // écrit dedans à chaque frame ; les contrôles caméra la suivent (cible orbite).
  const rocketPos = useRef<THREE.Vector3 | null>(null)
  // Distance scène du radar le plus éloigné : cadre la caméra et sa portée.
  const radarDistance = Math.max(0, ...radars.map((r) => r.offset.sceneRadius))
  // La portée du VOL (rangeM, en MÈTRES) peut dépasser celle du radar le plus
  // proche — terrain et caméra doivent couvrir le plus grand des deux. On
  // convertit en unités scène (METERS_PER_SCENE_UNIT) pour rester homogène avec
  // radarDistance (déjà en unités).
  const flightRangeDistance = (flight?.rangeM ?? 0) / METERS_PER_SCENE_UNIT
  const farDistance = Math.max(radarDistance, flightRangeDistance)
  // Rayon du terrain unifié : couvre jusqu'à la vraie distance du scénario, plus
  // une marge pour que son bord reste hors champ (masqué par le fog à l'étape 3).
  // Plancher = zone dense (TERRAIN_EDGE_RADIUS) même sans radar lointain.
  const terrainRadius = Math.max(TERRAIN_EDGE_RADIUS, farDistance) + TERRAIN_OUTER_MARGIN
  // Un vol réaliste peut dépasser 40 km réels (= 80 000 unités scène à
  // l'échelle actuelle, METERS_PER_SCENE_UNIT=0.5) : near/far et le depth
  // buffer standard souffriraient de précision flottante à cette distance —
  // near relevé + logarithmicDepthBuffer (voir <Canvas> plus bas) sont le
  // remède standard Three.js pour les scènes à grande échelle.
  const cameraFar = Math.max(2200, (farDistance + 200) * 1.2)
  // Position caméra initiale : distance FIXE proche du pas de tir (voir
  // INITIAL_CAMERA_DIST) — jamais dérivée de radarDistance, qui vaut la vraie
  // distance réelle (parfois 50-60 km) depuis le passage à l'échelle linéaire.
  const camDir = new THREE.Vector3(...CAMERA_POSITION).normalize()
  const cameraPosition = camDir.multiplyScalar(INITIAL_CAMERA_DIST).toArray() as [number, number, number]

  return (
    <Canvas
      className={className}
      // near relevé (2, pas 0.5) : à l'échelle réelle un vol peut atteindre
      // des dizaines de milliers d'unités (40 km = 40 000 u) — un near trop
      // proche combiné à un grand far dégrade fortement la précision du depth
      // buffer standard (z-fighting/jitter). logarithmicDepthBuffer (ci-dessous)
      // est le remède standard Three.js pour ce cas.
      // fov élargi (65, pas 42) : une caméra de poursuite qui suit un vol de
      // plusieurs dizaines de km a besoin de marge de cadrage — un fov étroit
      // (téléobjectif) perd vite la fusée dès qu'elle dévie latéralement.
      camera={{ position: cameraPosition, fov: 65, near: 2, far: cameraFar }}
      gl={{ antialias: false, powerPreference: 'high-performance', logarithmicDepthBuffer: true }}
      // Ombres douces FIGÉES : autoUpdate=false + FreezeShadows (voir plus bas)
      // — le shadow pass ne tourne que quelques frames après (re)chargement,
      // puis les ombres sont gratuites. Budget AMD 60 FPS respecté.
      shadows="soft"
      dpr={[1, 1.25]}
      onCreated={({ gl, scene }) => {
        // ACES : tone mapping filmique (rendu photo). L'exposition initiale est
        // celle du jour ; SceneTone la rend réactive au mode/biome ensuite.
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = DAYLIGHT_EXPOSURE
        scene.background = new THREE.Color(DAYLIGHT_BACKGROUND)
        gl.shadowMap.autoUpdate = false
        gl.shadowMap.needsUpdate = true
      }}
    >
      <Suspense fallback={<color attach="background" args={[DAYLIGHT_BACKGROUND]} />}>
        {/* Brume de profondeur LINÉAIRE calée sur le rayon du terrain : le pas
            de tir reste net, l'horizon se dissout dans la couleur du ciel pile
            au bord du terrain — le « bout du monde » devient invisible. */}
        <fog
          attach="fog"
          args={[
            night ? NIGHT_FOG_COLOR : desert ? DESERT_FOG_COLOR : FOG_COLOR,
            terrainRadius * FOG_NEAR_FRAC,
            terrainRadius * FOG_FAR_FRAC,
          ]}
        />
        {/* Dégage le fog en altitude (suivi de la fusée qui monte) : dense au
            sol, léger en l'air → la fusée reste nette haut dans le ciel. */}
        <AltitudeFog baseFar={terrainRadius * FOG_FAR_FRAC} />
        {/* Exposition + fond réactifs au mode (jour/nuit) et au biome. */}
        <SceneTone mode={mode} biome={biome} />
        {/* Re-cuisson des ombres figées : à la bascule jour/nuit ET quand la
            rampe se réoriente (sinon son ombre resterait figée dans l'ancienne
            pose). 6 frames de shadow pass, puis gel — coût quasi nul. */}
        <FreezeShadows resetKey={`${mode}:${inclinationDeg}:${azimuthDeg}`} />
        {/* Dôme de ciel en dégradé (jour) : zénith bleu → horizon = couleur du
            fog, pour que la limite du terrain se fonde dans le ciel. La nuit
            garde le fond uni de SceneTone + les étoiles. */}
        {!night && (
          <SkyDome
            zenithColor={SKY_GRADIENT.zenith}
            horizonColor={SKY_GRADIENT.horizon}
            radius={cameraFar * 0.9}
          />
        )}
        {/* Distance du soleil toujours > cameraFar (rayon proportionnel, voir
            DaylightSky) : reste cohérent quelle que soit l'échelle de la scène. */}
        {night ? <NightSky /> : <DaylightSky distance={cameraFar * 1.3} />}
        {/* Golden hour : soleil rasant chaud + hémisphérique (jour) / lune
            (nuit), avec ombres portées. Shadow-camera SERRÉE sur la zone
            proche (SHADOW_COVERAGE_RADIUS) : texel net, jamais terrainRadius. */}
        {night ? (
          <MoonLight shadowRadius={SHADOW_COVERAGE_RADIUS} />
        ) : (
          <SunLight shadowRadius={SHADOW_COVERAGE_RADIUS} />
        )}
        <OutdoorEnvironment mode={mode} />

        {/* TERRAIN UNIFIÉ : un seul sol continu du pas de tir jusqu'à l'horizon
            (densité dégressive), couvrant la vraie distance du scénario — plus
            de couture proche/lointain. */}
        <UnifiedTerrain biome={biome} outerRadius={terrainRadius} />

        {desert ? (
          <>
            {/* Désert : cactus épars, oasis (eau + palmiers), buissons secs.
                Bornés à la zone dense proche (densité décroissante à l'étape 4). */}
            <CactusField radius={TERRAIN_EDGE_RADIUS} />
            <OasisPatch />
            <DryScrubField radius={TERRAIN_EDGE_RADIUS} />
          </>
        ) : (
          <>
            {/* Prairie : touffes d'herbe dense PARTOUT, streaming par tuiles
                autour de la caméra (voir useGrassTiles) — coût borné même sur
                une map très étendue. */}
            <GrassField biome={biome} />
          </>
        )}
        {/* Rochers procéduraux légers : densité de sol sur toute la map. */}
        <RockField biome={biome} terrainRadius={terrainRadius} />
        {/* Poussière/pollen doré flottant dans l'air (golden hour). */}
        <AtmosphereParticles />
        {/* Nuages golden hour à l'horizon (jour uniquement — étoiles la nuit). */}
        {!night && <CloudLayer />}

        <group position={LAUNCH_CENTER}>
          {/* Relève TOUT le pas de tir (dalle + rampe + console + vol) au-dessus
              du relief réel sous son emprise — même formule que la collision
              (sampleSceneGround), sinon la dalle reste plaquée à Y=0 et peut se
              retrouver sous le terrain qui l'entoure (fusée « enfoncée »). Les
              radars ne sont PAS dans ce groupe : ils calculent déjà leur propre
              élévation via sampleSceneGround (qui inclut ce même lift dans son
              emprise) — les doubler ici les ferait flotter. */}
          <group position={[0, padLift, 0]}>
            {/* Zone de lancement en béton (plateforme à gradins + voies + annexes). */}
            <LaunchComplex biome={biome} />

            {/* Rampe, console et vol posés SUR le plateau supérieur de la dalle. */}
            <group position={[0, PAD_TOP_Y, 0]}>
              {/* Trace de brûlure/suie au sol autour de la rampe (apparaît au tir). */}
              <ScorchDecal launched={flying} />
              <LaunchRail inclinationDeg={inclinationDeg} azimuthDeg={azimuthDeg} launched={flying} />
              <ControlConsole launchEnabled={launchEnabled} onLaunch={onLaunch} />
              {/* Vol de la Mesange : rejoue la VRAIE trajectoire RocketPy, casse
                  à l'impact. Sa position alimente la caméra de suivi (rocketPos). */}
              <FlyingMesange
                flight={flight}
                origin={flightOrigin}
                active={flying}
                biome={biome}
                onFlightFrame={(p, progress) => {
                  // p est LOCAL aux groupes surélevés : on ajoute PAD_TOP_Y + padLift
                  // pour la position MONDE attendue par la caméra de suivi.
                  if (!rocketPos.current) rocketPos.current = new THREE.Vector3()
                  rocketPos.current.set(p.x, p.y + PAD_TOP_Y + padLift, p.z)
                  // Progression du vol (0→1) partagée avec la Tactical View
                  // (piste radar temps réel), sans re-render React.
                  if (flightProgressRef) flightProgressRef.current = progress
                }}
              />
            </group>
          </group>

          {radars.map((radar) => (
            <SceneRadar key={radar.id} config={radar.config} offset={radar.offset} biome={biome} />
          ))}
        </group>

        {/* Caméra UNIQUE : orbite libre en permanence (même en vol). Pendant le
            vol, la cible suit la fusée ; à la fin, retour doux vers le pad.
            maxDistance suit farDistance (radar OU portée réelle du vol, le
            plus grand des deux) : sinon un vol qui dépasse la couverture
            radar resterait hors de portée de zoom de la caméra suiveuse. */}
        <LaunchCameraControls
          rocketRef={rocketPos}
          flying={flying}
          armed={launchEnabled}
          maxDistance={Math.max(600, farDistance * 1.5)}
          biome={biome}
        />

        {/* Post-processing (SMAA obligatoire — l'AA natif est coupé — puis
            bloom/grain/vignette). Garde-fou FPS : constantes de postFx.ts. */}
        {POSTFX_ENABLED && <PostFX quality={POSTFX_QUALITY} />}
      </Suspense>

      {/* Compteur FPS (développement uniquement) : mesure avant/après réglages. */}
      {import.meta.env.DEV && <Stats />}
    </Canvas>
  )
}
