import { Suspense, memo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { RadarModel } from '@/three/models/RadarModel'
import { CameraRig } from './CameraRig'
import { RadarLighting } from './RadarLighting'
import { GlContextReleaser } from './GlContextReleaser'

interface RadarPreviewCanvasProps {
  modelPath: string
  tintColor?: string
  /** Identifiant du modèle courant : réarme le cadrage caméra au changement. */
  resetKey?: string
  className?: string
}

/**
 * Mémoïsé : ne dépend que du modèle + teinte. Sans ça, bouger un curseur de
 * réglage (portée/plafond) re-rendait tout le Canvas Three.js à chaque cran
 * et rendait le slider saccadé.
 */
function RadarPreviewCanvasComponent({ modelPath, tintColor, resetKey, className }: RadarPreviewCanvasProps) {
  const modelRef = useRef<THREE.Group>(null)

  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 16], fov: 32 }}
      // Aperçu allégé : pas d'ombres, dpr plafonné, powerPreference par défaut —
      // évite de saturer WebGL (context lost) quand on change de radar, surtout
      // à côté du canvas de la scène de lancement.
      gl={{ alpha: true, antialias: true, powerPreference: 'default' }}
      dpr={[1, 1.25]}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
      }}
    >
      <GlContextReleaser />
      <Suspense fallback={null}>
        <RadarLighting />
        <RadarModel ref={modelRef} modelPath={modelPath} tintColor={tintColor} />
        <CameraRig targetRef={modelRef} resetKey={resetKey} />
      </Suspense>
    </Canvas>
  )
}

export const RadarPreviewCanvas = memo(RadarPreviewCanvasComponent)
