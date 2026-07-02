import { Suspense, memo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { DecorMesangeLaunch } from '@/three/models/DecorMesangeLaunch'
import { LaunchPad } from '@/three/models/LaunchPad'
import { LaunchSceneLighting } from '@/three/canvas/LaunchSceneLighting'
import { LaunchEnvironment } from '@/three/canvas/LaunchEnvironment'
import { useGroundTexture } from '@/three/hooks/useGroundTexture'
import { DAY_AMBIANCE } from '@/three/constants/launchAmbiance'

// Même scène que /lancement (sol, pad, ciel, éclairage), juste sans radar et
// avec une Mesange agrandie sur une trajectoire calibrée pour tenir dans le
// cadre fixe de cette caméra — purement décoratif.
// L'arc réel du placeholder (cf. useProjectileLaunch) va de x=0 à ~35 unités
// locales et monte à ~13 — la caméra doit cadrer toute cette plage une fois
// le facteur SCALE appliqué.
const SCALE = 1.6
const AZIMUTH_DEG = 100
const INCLINATION_DEG = 58
const DECOR_SPEED = 16
const DECOR_GRAVITY = 6.4
const FOG_NEAR = 60
const FOG_FAR = 360
const GROUND_SIZE = 2000
const CAMERA_POSITION: [number, number, number] = [30, 22, 95]
const CAMERA_TARGET: [number, number, number] = [25, 10, 0]

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
        <DecorMesangeLaunch
          azimuthDeg={AZIMUTH_DEG}
          inclinationDeg={INCLINATION_DEG}
          speed={DECOR_SPEED}
          gravity={DECOR_GRAVITY}
        />
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
        className="mission-decor-canvas scale-110 blur-[13px]"
        camera={{ position: CAMERA_POSITION, fov: 50, near: 1, far: 2000 }}
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
