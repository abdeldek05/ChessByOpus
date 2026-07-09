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
import { SceneRadar } from '@/three/models/SceneRadar'
import { ControlConsole } from '@/three/models/ControlConsole'
import { DAYLIGHT_EXPOSURE, DAYLIGHT_BACKGROUND } from '@/three/constants/launchDaylight'
import { LAUNCH_CENTER, CAMERA_POSITION, CAMERA_TARGET } from '@/three/constants/sceneLayout'
import type { RadarConfig } from '@/types/radar.types'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'

/** Un radar à afficher dans la scène : sa config + son décalage scène calculé. */
export interface RadarInScene {
  id: string
  config: RadarConfig
  offset: SceneOffset
}

interface LaunchSceneCanvasProps {
  /** Radars placés (1-2), tous rendus à leur direction réelle. */
  radars: RadarInScene[]
  launchEnabled: boolean
  onLaunch: () => void
  /** Menace principale (Roi) : incline la rampe et l'oriente. */
  inclinationDeg: number
  azimuthDeg: number
  className?: string
}

// Pelouse minimale (radar proche). Au-delà, le sol s'étend pour englober le
// radar le plus éloigné (échelle √ relevée, cf. computeRadarSceneOffset).
const MIN_LAWN_SIZE = 900
// Recul caméra initial = une fraction de la distance du radar le plus loin, pour
// cadrer l'ENSEMBLE pas-de-tir + radars sans coller à la base ni partir trop loin.
const CAMERA_PULLBACK_FACTOR = 0.75

export function LaunchSceneCanvas({
  radars,
  launchEnabled,
  onLaunch,
  inclinationDeg,
  azimuthDeg,
  className,
}: LaunchSceneCanvasProps) {
  // Distance scène du radar le plus éloigné : cadre la caméra, le sol, sa portée.
  const radarDistance = Math.max(0, ...radars.map((r) => r.offset.sceneRadius))
  // Sol qui englobe toujours le radar le plus loin, avec marge.
  const lawnSize = Math.max(MIN_LAWN_SIZE, (radarDistance + 200) * 2)
  const cameraFar = Math.max(2200, lawnSize * 2)
  // Position caméra reculée le long de la direction par défaut, pour englober
  // le radar le plus loin tout en gardant le pas de tir lisible.
  const camDir = new THREE.Vector3(...CAMERA_POSITION).normalize()
  const camDist = Math.max(28, radarDistance * CAMERA_PULLBACK_FACTOR)
  const cameraPosition = camDir.multiplyScalar(camDist).toArray() as [number, number, number]

  return (
    <Canvas
      className={className}
      camera={{ position: cameraPosition, fov: 42, near: 0.5, far: cameraFar }}
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
        {/* Brouillard nuit subtil : donne de la profondeur et fond l'horizon
            désert. Démarre au-delà du radar le plus loin pour ne pas le noyer. */}
        <fog attach="fog" args={[DAYLIGHT_BACKGROUND, radarDistance + 120, radarDistance + 520]} />
        <FreezeShadows />
        <DaylightSky />
        <SunLight />
        <OutdoorEnvironment />

        <LawnGround size={lawnSize} />

        <group position={LAUNCH_CENTER}>
          <LaunchRail inclinationDeg={inclinationDeg} azimuthDeg={azimuthDeg} />
          <ControlConsole launchEnabled={launchEnabled} onLaunch={onLaunch} />

          {radars.map((radar) => (
            <SceneRadar key={radar.id} config={radar.config} offset={radar.offset} />
          ))}
        </group>

        {/* Caméra libre : rotation, zoom et pan à l'utilisateur. maxPolarAngle
            bloqué juste au-dessus de l'horizon pour ne jamais passer SOUS le
            sol (sinon on verrait la scène par en dessous). */}
        <OrbitControls
          target={CAMERA_TARGET}
          enableDamping
          dampingFactor={0.1}
          minDistance={5}
          maxDistance={Math.max(600, radarDistance * 2.5)}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />

        <PostFX />
      </Suspense>
    </Canvas>
  )
}
