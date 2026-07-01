import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { MesangeLaunch } from '@/three/models/MesangeLaunch'
import { RadarModel } from '@/three/models/RadarModel'
import { LaunchPad } from '@/three/models/LaunchPad'
import { LaunchSceneLighting } from './LaunchSceneLighting'
import { LaunchEnvironment } from './LaunchEnvironment'
import type { LaunchAmbiance } from '@/three/constants/launchAmbiance'
import type { RadarConfig } from '@/types/radar.types'
import type { MesangeLaunchConfig } from '@/types/mission.types'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'

// Au minimum on recule assez pour voir tout l'arc de tir (apogée ~28 unités).
const MIN_CAMERA_DISTANCE = 58

interface LaunchSceneCanvasProps {
  radarConfig: RadarConfig
  radarOffset: SceneOffset
  mesangeConfigs: MesangeLaunchConfig[]
  ambiance: LaunchAmbiance
  className?: string
}

export function LaunchSceneCanvas({ radarConfig, radarOffset, mesangeConfigs, ambiance, className }: LaunchSceneCanvasProps) {
  const sceneDistance = Math.hypot(radarOffset.x, radarOffset.z)
  const cameraDistance = Math.max(MIN_CAMERA_DISTANCE, sceneDistance * 1.6)
  const groundSize = Math.max(600, sceneDistance * 6)
  const fogFar = Math.max(260, sceneDistance * 3 + 220)
  const fogNear = fogFar * 0.25
  const target: [number, number, number] = [radarOffset.x / 2, 8, radarOffset.z / 2]

  return (
    <Canvas
      className={className}
      camera={{ position: [cameraDistance * 0.6, cameraDistance * 0.5, cameraDistance * 0.6], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      shadows="soft"
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.0
      }}
    >
      <Suspense fallback={null}>
        <LaunchEnvironment ambiance={ambiance} fogNear={fogNear} fogFar={fogFar} />
        <LaunchSceneLighting ambiance={ambiance} />

        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[groundSize, groundSize]} />
          <meshStandardMaterial color={ambiance.ground} roughness={1} metalness={0} />
        </mesh>

        <LaunchPad />

        {mesangeConfigs.map((config) => (
          <MesangeLaunch key={config.id} inclinationDeg={config.inclinationDeg} azimuthDeg={config.azimuthDeg} />
        ))}

        <group position={[radarOffset.x, 0, radarOffset.z]}>
          <RadarModel modelPath={radarConfig.modelPath} tintColor={radarConfig.tintColor} />
        </group>

        <OrbitControls
          target={target}
          enablePan={false}
          minDistance={MIN_CAMERA_DISTANCE / 3}
          maxDistance={cameraDistance * 2.5}
          maxPolarAngle={Math.PI * 0.495}
        />
      </Suspense>
    </Canvas>
  )
}
