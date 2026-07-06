import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { DaylightSky } from './DaylightSky'
import { SunLight } from './SunLight'
import { OutdoorEnvironment } from './OutdoorEnvironment'
import { FreezeShadows } from './FreezeShadows'
import { ChaseCamera } from './ChaseCamera'
import { PostFX } from './PostFX'
import { LawnGround } from '@/three/models/LawnGround'
import { LauncherRig } from '@/three/models/LauncherRig'
import { RocketOnLauncher } from '@/three/models/RocketOnLauncher'
import { RadarModel } from '@/three/models/RadarModel'
import { ControlConsole } from '@/three/models/ControlConsole'
import { TrajectoryArc } from '@/three/models/TrajectoryArc'
import { DAYLIGHT_EXPOSURE, DAYLIGHT_BACKGROUND } from '@/three/constants/launchDaylight'
import { LAUNCH_CENTER, CAMERA_POSITION, CAMERA_TARGET } from '@/three/constants/sceneLayout'
import type { RadarConfig } from '@/types/radar.types'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'
import type { LaunchPhase } from '@/hooks/useLaunchSequence'

interface LaunchSceneCanvasProps {
  radarConfig: RadarConfig
  radarOffset: SceneOffset
  launchEnabled: boolean
  onLaunch: () => void
  /** Phase courante (pilote la caméra de poursuite). */
  phase: LaunchPhase
  /** Début de vol (performance.now) ; null au sol. */
  startRef: React.RefObject<number | null>
  /** Menace principale à faire voler. */
  azimuthDeg: number
  inclinationDeg: number
  /** Affiche l'arc de trajectoire (dès le décollage). */
  showTrajectory: boolean
  className?: string
}

const LAWN_SIZE = 900
const CAMERA_FAR = 2200

export function LaunchSceneCanvas({
  radarConfig,
  radarOffset,
  launchEnabled,
  onLaunch,
  phase,
  startRef,
  azimuthDeg,
  inclinationDeg,
  showTrajectory,
  className,
}: LaunchSceneCanvasProps) {
  const radarDistance = Math.hypot(radarOffset.x, radarOffset.z)
  const worldPosRef = useRef(new THREE.Vector3())
  const controlsRef = useRef<OrbitControlsImpl>(null)

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
          <LauncherRig />
          <RocketOnLauncher
            startRef={startRef}
            azimuthDeg={azimuthDeg}
            inclinationDeg={inclinationDeg}
            worldPosRef={worldPosRef}
          />
          <ControlConsole launchEnabled={launchEnabled} onLaunch={onLaunch} />
          {showTrajectory && <TrajectoryArc azimuthDeg={azimuthDeg} inclinationDeg={inclinationDeg} />}

          <group position={[radarOffset.x, 0, radarOffset.z]}>
            <RadarModel
              modelPath={radarConfig.modelPath}
              tintColor={radarConfig.tintColor}
              shadows={false}
            />
          </group>
        </group>

        <ChaseCamera
          worldPosRef={worldPosRef}
          phase={phase}
          controlsRef={controlsRef}
          homePosition={CAMERA_POSITION}
          homeTarget={CAMERA_TARGET}
        />

        {/* Caméra libre en permanence : rotation, zoom et déplacement latéral
            (pan) sont toujours à l'utilisateur, avec assez de recul pour voir
            toute la map (900 unités de pelouse + le radar, où qu'il soit). */}
        <OrbitControls
          ref={controlsRef}
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
