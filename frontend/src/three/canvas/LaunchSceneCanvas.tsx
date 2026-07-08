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

const LAWN_SIZE = 900
const CAMERA_FAR = 2200

export function LaunchSceneCanvas({
  radarConfig,
  radarOffset,
  launchEnabled,
  onLaunch,
  inclinationDeg,
  azimuthDeg,
  className,
}: LaunchSceneCanvasProps) {
  const radarDistance = Math.hypot(radarOffset.x, radarOffset.z)

  return (
    <Canvas
      className={className}
      camera={{ position: CAMERA_POSITION, fov: 42, near: 0.5, far: CAMERA_FAR }}
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

        <LawnGround size={LAWN_SIZE} />

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
