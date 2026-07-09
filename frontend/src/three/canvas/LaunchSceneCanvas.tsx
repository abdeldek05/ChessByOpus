import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { DaylightSky } from './DaylightSky'
import { SunLight } from './SunLight'
import { OutdoorEnvironment } from './OutdoorEnvironment'
import { FreezeShadows } from './FreezeShadows'
import { PostFX } from './PostFX'
import { LawnGround } from '@/three/models/LawnGround'
import { LaunchRail } from '@/three/models/LaunchRail'
import { RadarModel } from '@/three/models/RadarModel'
import { ControlConsole } from '@/three/models/ControlConsole'
import { DAYLIGHT_EXPOSURE, DAYLIGHT_BACKGROUND } from '@/three/constants/launchDaylight'
import { LAUNCH_CENTER, CAMERA_POSITION, CAMERA_TARGET } from '@/three/constants/sceneLayout'
import type { RadarConfig } from '@/types/radar.types'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'

interface LaunchSceneCanvasProps {
  radarConfig: RadarConfig
  radarOffset: SceneOffset
  launchEnabled: boolean
  onLaunch: () => void
  /** Menace principale (Roi) : incline la rampe et l'oriente. */
  inclinationDeg: number
  azimuthDeg: number
  className?: string
}

// Taille MINIMALE de la pelouse (unités) : cadre serré autour de la base quand
// le radar est proche. Au-delà, le terrain s'étend pour englober le radar réel.
const MIN_LAWN_SIZE = 900
// Marge de pelouse au-delà du radar (unités), pour qu'il ne soit jamais pile au
// bord. ~80 unités = 16 km de dégagement à l'échelle 1:200.
const LAWN_MARGIN = 120

export function LaunchSceneCanvas({
  radarConfig,
  radarOffset,
  launchEnabled,
  onLaunch,
  inclinationDeg,
  azimuthDeg,
  className,
}: LaunchSceneCanvasProps) {
  const radarDistance = radarOffset.sceneRadius
  // Terrain qui englobe toujours le radar (échelle FIXE 1:200 : on ne compresse
  // pas la distance, c'est la scène qui s'agrandit). Le bord dépasse le radar
  // de LAWN_MARGIN ; la caméra recule d'autant pour tout garder à l'écran.
  const lawnSize = Math.max(MIN_LAWN_SIZE, (radarDistance + LAWN_MARGIN) * 2)
  const cameraFar = Math.max(2200, lawnSize * 2.5)

  return (
    <Canvas
      className={className}
      camera={{ position: CAMERA_POSITION, fov: 42, near: 0.5, far: cameraFar }}
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
        <FreezeShadows />
        <DaylightSky />
        <SunLight />
        <OutdoorEnvironment />

        <LawnGround size={lawnSize} />

        <group position={LAUNCH_CENTER}>
          <LaunchRail inclinationDeg={inclinationDeg} azimuthDeg={azimuthDeg} />
          <ControlConsole launchEnabled={launchEnabled} onLaunch={onLaunch} />

          <group position={[radarOffset.x, 0, radarOffset.z]}>
            <RadarModel modelPath={radarConfig.modelPath} tintColor={radarConfig.tintColor} shadows={false} />
          </group>
        </group>

        {/* Caméra libre : rotation, zoom et pan toujours à l'utilisateur, avec
            assez de recul pour voir toute la map. */}
        <OrbitControls
          target={CAMERA_TARGET}
          enableDamping
          dampingFactor={0.1}
          minDistance={5}
          maxDistance={Math.max(600, radarDistance * 2.5)}
          maxPolarAngle={Math.PI * 0.98}
        />

        <PostFX />
      </Suspense>
    </Canvas>
  )
}
