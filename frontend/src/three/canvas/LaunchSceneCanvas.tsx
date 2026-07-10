import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import * as THREE from 'three'
import { DaylightSky } from './DaylightSky'
import { SunLight } from './SunLight'
import { OutdoorEnvironment } from './OutdoorEnvironment'
import { FreezeShadows } from './FreezeShadows'
import { LaunchCameraControls } from './LaunchCameraControls'
import { PostFX } from './PostFX'
import { LawnGround } from '@/three/models/LawnGround'
import { CloudLayer } from '@/three/models/CloudLayer'
import { GrassField } from '@/three/models/GrassField'
import { RockField } from '@/three/models/RockField'
import { TreeField } from '@/three/models/TreeField'
import { LaunchComplex } from '@/three/models/LaunchComplex'
import { PAD_TOP_Y } from '@/three/constants/launchComplex'
import { AtmosphereParticles } from '@/three/models/AtmosphereParticles'
import { LaunchRail } from '@/three/models/LaunchRail'
import { ScorchDecal } from '@/three/models/ScorchDecal'
import { SceneRadar } from '@/three/models/SceneRadar'
import { ControlConsole } from '@/three/models/ControlConsole'
import { FlyingMesange } from '@/three/models/FlyingMesange'
import {
  DAYLIGHT_EXPOSURE,
  DAYLIGHT_BACKGROUND,
  FOG_COLOR,
  FOG_NEAR_FRAC,
  FOG_FAR_FRAC,
} from '@/three/constants/launchDaylight'
import {
  LAUNCH_CENTER,
  CAMERA_POSITION,
  TERRAIN_EDGE_RADIUS,
} from '@/three/constants/sceneLayout'
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
  className?: string
}

// Recul caméra initial = une fraction de la distance du radar le plus loin, pour
// cadrer l'ENSEMBLE pas-de-tir + radars sans coller à la base ni partir trop loin.
const CAMERA_PULLBACK_FACTOR = 0.75

export function LaunchSceneCanvas({
  radars,
  launchEnabled,
  onLaunch,
  inclinationDeg,
  azimuthDeg,
  flying,
  flight,
  className,
}: LaunchSceneCanvasProps) {
  // Origine du vol = sommet de rampe, LOCALE au groupe surélevé (déjà décalé de
  // PAD_TOP_Y) → juste +4. La trajectoire RocketPy est rejouée à partir de là.
  const flightOrigin = new THREE.Vector3(0, 4, 0)
  // Position monde de la fusée en vol, partagée avec la caméra de suivi. Le vol
  // écrit dedans à chaque frame ; les contrôles caméra la suivent (cible orbite).
  const rocketPos = useRef<THREE.Vector3 | null>(null)
  // Distance scène du radar le plus éloigné : cadre la caméra et sa portée.
  const radarDistance = Math.max(0, ...radars.map((r) => r.offset.sceneRadius))
  // Taille du terrain : couvre le rayon utile + le radar le plus loin, avec marge.
  const terrainSize = Math.max(TERRAIN_EDGE_RADIUS * 2, (radarDistance + 200) * 2)
  const halfLawn = terrainSize / 2
  const cameraFar = Math.max(2200, terrainSize * 2)
  // Position caméra reculée le long de la direction par défaut, pour englober
  // le radar le plus loin tout en gardant le pas de tir lisible.
  const camDir = new THREE.Vector3(...CAMERA_POSITION).normalize()
  const camDist = Math.max(28, radarDistance * CAMERA_PULLBACK_FACTOR)
  const cameraPosition = camDir.multiplyScalar(camDist).toArray() as [number, number, number]

  return (
    <Canvas
      className={className}
      camera={{ position: cameraPosition, fov: 42, near: 0.5, far: cameraFar }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      // Ombres douces rendues quelques frames puis figées (FreezeShadows).
      shadows="soft"
      dpr={[1, 1.25]}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = DAYLIGHT_EXPOSURE
        scene.background = new THREE.Color(DAYLIGHT_BACKGROUND)
        gl.shadowMap.autoUpdate = false
        gl.shadowMap.needsUpdate = true
      }}
    >
      <Suspense fallback={<color attach="background" args={[DAYLIGHT_BACKGROUND]} />}>
        {/* Brume atmosphérique golden hour : fond l'horizon dans une teinte
            dorée (profondeur + échelle), proportionnelle à la taille du terrain. */}
        <fog attach="fog" args={[FOG_COLOR, halfLawn * FOG_NEAR_FRAC, halfLawn * FOG_FAR_FRAC]} />
        <FreezeShadows />
        <DaylightSky />
        <SunLight shadowRadius={Math.max(60, radarDistance + 30)} />
        <OutdoorEnvironment />

        {/* Terrain plein (pas d'eau dans la scène). */}
        <LawnGround size={terrainSize} />
        {/* Herbe instanciée sur le terrain (rayon = demi-terrain). */}
        <GrassField radius={terrainSize / 2} />
        {/* Arbres en bosquets (rayon = bord du terrain). */}
        <TreeField radius={terrainSize / 2} />
        {/* Rochers épars dans le champ. */}
        <RockField />
        {/* Poussière/pollen doré flottant dans l'air (golden hour). */}
        <AtmosphereParticles />
        {/* Nuages golden hour à l'horizon (dérive très lente, quasi statiques). */}
        <CloudLayer />

        <group position={LAUNCH_CENTER}>
          {/* Zone de lancement en béton (plateforme à gradins + voies + annexes). */}
          <LaunchComplex />

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
              onFlightFrame={(p) => {
                // p est LOCAL au groupe surélevé : on ajoute PAD_TOP_Y pour la
                // position MONDE attendue par la caméra de suivi.
                if (!rocketPos.current) rocketPos.current = new THREE.Vector3()
                rocketPos.current.set(p.x, p.y + PAD_TOP_Y, p.z)
              }}
            />
          </group>

          {radars.map((radar) => (
            <SceneRadar key={radar.id} config={radar.config} offset={radar.offset} />
          ))}
        </group>

        {/* Caméra UNIQUE : orbite libre en permanence (même en vol). Pendant le
            vol, la cible suit la fusée ; à la fin, retour doux vers le pad. */}
        <LaunchCameraControls
          rocketRef={rocketPos}
          flying={flying}
          maxDistance={Math.max(600, radarDistance * 2.5)}
        />

        <PostFX />
      </Suspense>

      {/* Compteur FPS (développement uniquement) : mesure avant/après réglages. */}
      {import.meta.env.DEV && <Stats />}
    </Canvas>
  )
}
