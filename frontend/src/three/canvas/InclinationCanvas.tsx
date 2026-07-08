import { memo } from 'react'
import { Canvas } from '@react-three/fiber'
import { SoundingRocketModel } from '@/three/models/SoundingRocketModel'
import { ElevationArcModel } from '@/three/models/ElevationArcModel'
import { AimPlane } from '@/three/models/AimPlane'

interface InclinationCanvasProps {
  inclinationDeg: number
  onChange: (deg: number) => void
}

/**
 * Scène du réglage d'élévation : fusée-sonde simplifiée + arc gradué. Éclairage
 * minimal (deux directionnelles + ambiante, ni ombres ni environnement) — rien
 * à charger, fluide par construction. On saisit la fusée n'importe où : le plan
 * de visée transforme le geste en angle exact autour du pivot.
 */
function InclinationCanvasComponent({ inclinationDeg, onChange }: InclinationCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0.8, 2.3, 8.4], fov: 38 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      onCreated={({ camera }) => camera.lookAt(0.7, 2.2, 0)}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      <directionalLight position={[-4, 2, -3]} intensity={0.45} />
      <SoundingRocketModel inclinationDeg={inclinationDeg} />
      <ElevationArcModel />
      <AimPlane onChange={onChange} />
    </Canvas>
  )
}

export const InclinationCanvas = memo(InclinationCanvasComponent)
