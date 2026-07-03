import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { MesangeErected } from '@/three/models/MesangeErected'
import { RadarModel } from '@/three/models/RadarModel'
import { LaunchPad } from '@/three/models/LaunchPad'
import { LaunchSceneLighting } from './LaunchSceneLighting'
import { LaunchEnvironment } from './LaunchEnvironment'
import { useGroundTexture } from '@/three/hooks/useGroundTexture'
import type { LaunchAmbiance } from '@/three/constants/launchAmbiance'
import type { RadarConfig } from '@/types/radar.types'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'

interface LaunchSceneCanvasProps {
  radarConfig: RadarConfig
  radarOffset: SceneOffset
  ambiance: LaunchAmbiance
  className?: string
}

// Rayon minimal de cadrage : même quand le radar est posé tout près, on garde
// assez de recul pour voir la Mesange dressée et le pad entiers.
const MIN_FRAMING_RADIUS = 26

export function LaunchSceneCanvas({ radarConfig, radarOffset, ambiance, className }: LaunchSceneCanvasProps) {
  const groundTexture = useGroundTexture()

  const sceneDistance = Math.hypot(radarOffset.x, radarOffset.z)
  const framingRadius = Math.max(sceneDistance, MIN_FRAMING_RADIUS)
  const cameraDistance = framingRadius * 1.7 + 10
  const fogFar = framingRadius * 4 + 60
  const fogNear = fogFar * 0.3
  const cameraFar = Math.max(1500, fogFar * 6)
  const groundSize = cameraFar * 1.5
  // Cible entre le pas de tir et le radar, un peu au-dessus du sol pour cadrer
  // la fusée dressée.
  const target: [number, number, number] = [radarOffset.x / 2, 10, radarOffset.z / 2]

  return (
    <Canvas
      className={className}
      camera={{ position: [cameraDistance * 0.6, cameraDistance * 0.5, cameraDistance * 0.6], fov: 42, near: 1, far: cameraFar }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      shadows
      dpr={[1, 1.25]}
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
          <meshStandardMaterial color={ambiance.ground} map={groundTexture} roughness={1} metalness={0} />
        </mesh>

        <LaunchPad />
        <MesangeErected />

        {/* Radar sans ombres : modèle très lourd — on réserve le budget de
            rendu à la fluidité et à la netteté de la scène. */}
        <group position={[radarOffset.x, 0, radarOffset.z]}>
          <RadarModel modelPath={radarConfig.modelPath} tintColor={radarConfig.tintColor} shadows={false} />
        </group>

        <OrbitControls
          target={target}
          enablePan={false}
          enableDamping
          dampingFactor={0.1}
          minDistance={framingRadius * 0.6}
          maxDistance={cameraDistance * 2.5}
          maxPolarAngle={Math.PI * 0.495}
        />
      </Suspense>
    </Canvas>
  )
}
