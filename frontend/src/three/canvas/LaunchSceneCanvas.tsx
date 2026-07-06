import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { DaylightSky } from './DaylightSky'
import { SunLight } from './SunLight'
import { OutdoorEnvironment } from './OutdoorEnvironment'
import { LawnGround } from '@/three/models/LawnGround'
import { GrassBlades } from '@/three/models/GrassBlades'
import { LauncherRig } from '@/three/models/LauncherRig'
import { RocketOnLauncher } from '@/three/models/RocketOnLauncher'
import { RadarModel } from '@/three/models/RadarModel'
import { DAYLIGHT_EXPOSURE, DAYLIGHT_BACKGROUND } from '@/three/constants/launchDaylight'
import { LAUNCH_CENTER, CAMERA_POSITION, CAMERA_TARGET } from '@/three/constants/sceneLayout'
import type { RadarConfig } from '@/types/radar.types'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'

interface LaunchSceneCanvasProps {
  radarConfig: RadarConfig
  radarOffset: SceneOffset
  className?: string
}

const LAWN_SIZE = 900
const CAMERA_FAR = 2200

export function LaunchSceneCanvas({ radarConfig, radarOffset, className }: LaunchSceneCanvasProps) {
  const radarDistance = Math.hypot(radarOffset.x, radarOffset.z)

  return (
    <Canvas
      className={className}
      camera={{ position: CAMERA_POSITION, fov: 42, near: 0.5, far: CAMERA_FAR }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      shadows
      // DPR plafonné à 1 : rendu allégé (moins de pixels à shader), la scène
      // est riche en géométrie/instances — on privilégie la fluidité.
      dpr={1}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = DAYLIGHT_EXPOSURE
        gl.shadowMap.type = THREE.PCFSoftShadowMap
        scene.background = new THREE.Color(DAYLIGHT_BACKGROUND)
      }}
    >
      <Suspense fallback={<color attach="background" args={[DAYLIGHT_BACKGROUND]} />}>
        <DaylightSky />
        <SunLight />
        <OutdoorEnvironment />

        {/* Sol + herbe couvrent toute la map, centrés sur l'origine monde ;
            leur relief est aplani autour de LAUNCH_CENTER (voir sampleLawnRelief). */}
        <LawnGround size={LAWN_SIZE} />
        <GrassBlades />

        {/* Banc de tir + fusée + radar poussés vers le bord de la pelouse. */}
        <group position={LAUNCH_CENTER}>
          <LauncherRig />
          <RocketOnLauncher />

          <group position={[radarOffset.x, 0, radarOffset.z]}>
            <RadarModel
              modelPath={radarConfig.modelPath}
              tintColor={radarConfig.tintColor}
              shadows={false}
            />
          </group>
        </group>

        <OrbitControls
          target={CAMERA_TARGET}
          enablePan={false}
          enableDamping
          dampingFactor={0.1}
          minDistance={5}
          maxDistance={Math.max(80, radarDistance * 2.2)}
          maxPolarAngle={Math.PI * 0.49}
        />
      </Suspense>
    </Canvas>
  )
}
