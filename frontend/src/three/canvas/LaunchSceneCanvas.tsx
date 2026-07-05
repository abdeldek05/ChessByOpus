import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { DaylightSky } from './DaylightSky'
import { SunLight } from './SunLight'
import { OutdoorEnvironment } from './OutdoorEnvironment'
import { LawnGround } from '@/three/models/LawnGround'
import { LauncherRig } from '@/three/models/LauncherRig'
import { RocketOnLauncher } from '@/three/models/RocketOnLauncher'
import { RadarModel } from '@/three/models/RadarModel'
import type { RadarConfig } from '@/types/radar.types'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'

interface LaunchSceneCanvasProps {
  radarConfig: RadarConfig
  radarOffset: SceneOffset
  className?: string
}

// La caméra démarre cadrée sur le banc de tir (le sujet) ; le radar se
// découvre en orbitant. La brume recule si le radar est loin.
const CAMERA_POSITION: [number, number, number] = [12, 5.2, 15]
const CAMERA_TARGET: [number, number, number] = [0, 3.4, 0]
const MIN_FOG_FAR = 380

export function LaunchSceneCanvas({ radarConfig, radarOffset, className }: LaunchSceneCanvasProps) {
  const radarDistance = Math.hypot(radarOffset.x, radarOffset.z)
  const fogFar = Math.max(MIN_FOG_FAR, radarDistance * 2.6 + 90)
  const fogNear = fogFar * 0.3
  const lawnSize = fogFar * 2.4
  const cameraFar = fogFar * 4

  return (
    <Canvas
      className={className}
      camera={{ position: CAMERA_POSITION, fov: 42, near: 0.5, far: cameraFar }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      shadows
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.95
        gl.shadowMap.type = THREE.PCFSoftShadowMap
      }}
    >
      <Suspense fallback={null}>
        <DaylightSky fogNear={fogNear} fogFar={fogFar} />
        <SunLight />
        <OutdoorEnvironment />

        <LawnGround size={lawnSize} />
        <LauncherRig />
        <RocketOnLauncher />

        {/* Radar posé à sa distance réelle à l'échelle, sans ombres : le
            modèle est lourd, le budget de rendu reste sur le banc de tir. */}
        <group position={[radarOffset.x, 0, radarOffset.z]}>
          <RadarModel
            modelPath={radarConfig.modelPath}
            tintColor={radarConfig.tintColor}
            shadows={false}
          />
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
