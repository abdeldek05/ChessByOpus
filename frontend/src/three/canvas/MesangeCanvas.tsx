import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { MesangeModel } from '@/three/models/MesangeModel'
import { CameraRig } from './CameraRig'
import { StudioLighting } from './StudioLighting'

interface MesangeCanvasProps {
  className?: string
}

export function MesangeCanvas({ className }: MesangeCanvasProps) {
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
        <StudioLighting />
        <MesangeModel ref={modelRef} />
        <CameraRig targetRef={modelRef} />
      </Suspense>
    </Canvas>
  )
}
