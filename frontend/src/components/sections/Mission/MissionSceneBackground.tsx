import { Suspense, memo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MesangeLaunch } from '@/three/models/MesangeLaunch'
import { LaunchPad } from '@/three/models/LaunchPad'
import { LaunchSceneLighting } from '@/three/canvas/LaunchSceneLighting'
import { LaunchEnvironment } from '@/three/canvas/LaunchEnvironment'
import { useGroundTexture } from '@/three/hooks/useGroundTexture'
import { DAY_AMBIANCE } from '@/three/constants/launchAmbiance'

// Même scène que /lancement (sol, pad, ciel, éclairage), juste sans radar et
// avec une Mesange agrandie sur une trajectoire plus ample — purement décoratif.
// Azimut 90° : l'arc se déploie latéralement (parallèle à l'écran), donc
// reste visible sur les bords au lieu de foncer droit vers/depuis la caméra.
const SCALE = 2.4
const AZIMUTH_DEG = 90
const INCLINATION_DEG = 62
const FOG_NEAR = 140
const FOG_FAR = 640
const GROUND_SIZE = 4000
// Recul et hauteur suffisants pour englober toute la portée (~50 unités à
// l'échelle avant le *SCALE) du placeholder balistique (cf. launchPhysics).
const CAMERA_POSITION: [number, number, number] = [6, 34, 150]
const CAMERA_TARGET: [number, number, number] = [0, 24, 0]

function DebugLogger() {
  const { camera } = useThree()
  const logged = useRef(false)
  useFrame(() => {
    if (logged.current) return
    logged.current = true
    console.log('[decor-debug] camera pos', camera.position.toArray(), 'fov', (camera as any).fov)
  })
  return null
}

function DecorScene() {
  const groundTexture = useGroundTexture()

  return (
    <>
      <LaunchEnvironment ambiance={DAY_AMBIANCE} fogNear={FOG_NEAR} fogFar={FOG_FAR} />
      <LaunchSceneLighting ambiance={DAY_AMBIANCE} />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial color={DAY_AMBIANCE.ground} map={groundTexture} roughness={1} metalness={0} />
      </mesh>

      <LaunchPad />

      <group scale={SCALE}>
        <MesangeLaunch azimuthDeg={AZIMUTH_DEG} inclinationDeg={INCLINATION_DEG} />
      </group>
    </>
  )
}

/**
 * Fond « écran d'accueil » : la même scène de lancement que /lancement (sol,
 * pad, ciel, éclairage), Mesange agrandie, floutée et assombrie pour laisser
 * le formulaire lisible par-dessus. Purement décoratif, jamais interactif.
 */
function MissionSceneBackgroundComponent() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Canvas
        className="scale-110 blur-[13px]"
        camera={{ position: CAMERA_POSITION, fov: 50, near: 1, far: 3000 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        dpr={[1, 1]}
        shadows
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
          camera.lookAt(...CAMERA_TARGET)
        }}
      >
        <Suspense fallback={null}>
          <DecorScene />
        </Suspense>
      </Canvas>
      <div className="absolute inset-0 bg-bg/45" />
    </div>
  )
}

// Mémoïsé (aucune prop) : le décor 3D ne se re-rend jamais quand le
// formulaire change, il reste fluide pendant qu'on règle les cadrans.
export const MissionSceneBackground = memo(MissionSceneBackgroundComponent)
