import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { RadarModel } from '@/three/models/RadarModel'
import { CameraRig } from './CameraRig'
import { RadarLighting } from './RadarLighting'

interface RadarPreviewCanvasProps {
  modelPath: string
  tintColor?: string
  className?: string
}

export function RadarPreviewCanvas({ modelPath, tintColor, className }: RadarPreviewCanvasProps) {
  const modelRef = useRef<THREE.Group>(null)

  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 16], fov: 32 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      shadows="soft"
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
      }}
    >
      <Suspense fallback={null}>
        <RadarLighting />
        <RadarModel ref={modelRef} modelPath={modelPath} tintColor={tintColor} />
        <CameraRig targetRef={modelRef} />
      </Suspense>
    </Canvas>
  )
}
