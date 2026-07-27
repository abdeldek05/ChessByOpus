import { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useOrbitTargetFollow } from '@/three/hooks/useOrbitTargetFollow'
import { useRadarViewCamera } from '@/three/hooks/useRadarViewCamera'
import { useWideCamera } from '@/three/hooks/useWideCamera'
import { useCameraGroundClamp } from '@/three/hooks/useCameraGroundClamp'
import { useLaunchShake } from '@/three/hooks/useLaunchShake'
import { CAMERA_TARGET } from '@/three/constants/sceneLayout'
import type { CameraMode } from '@/types/scene.types'

interface LaunchCameraControlsProps {
  /** Position monde de la fusée (King) en vol (null hors vol) — cible du suivi. */
  rocketRef: React.RefObject<THREE.Vector3 | null>
  /** Vol en cours : la cible des contrôles suit la fusée. */
  flying: boolean
  /** Scénario réarmé (juste après replay) : force un retour caméra instantané
   * vers le pad, sans attendre l'amortissement normal. */
  armed?: boolean
  /** Distance max de zoom (proportionnelle à la taille du terrain). */
  maxDistance: number
  /** Mode de caméra courant (voir CameraMode) — défaut 'follow'. */
  mode?: CameraMode
  /** Position scène (x,z) du 1er radar — pour la vue côté radar. */
  radarScene?: { x: number; z: number } | null
  /** Rayon scène à cadrer (radar le plus loin) — pour la vue large fixe. */
  frameRadius?: number
}

/**
 * Contrôles caméra de la scène de lancement, avec TROIS modes commutables en
 * vol (voir CameraMode) :
 * - 'follow' : orbite/zoom libres, la caméra suit le King de près (translation
 *   rigide, voir useOrbitTargetFollow) ; à la fin, retour doux vers le pad.
 * - 'radar'  : caméra posée au radar, regarde les fusées monter (défenseur).
 * - 'wide'   : caméra fixe en recul, cadre tout le théâtre en permanence.
 *
 * Un seul hook pilote la caméra à la fois (les autres reçoivent enabled=false
 * et ne la touchent pas — règle des Hooks respectée, tous appelés). En mode
 * radar/wide, OrbitControls est désactivé (caméra pilotée, pas orbitée).
 */
export function LaunchCameraControls({
  rocketRef,
  flying,
  armed,
  maxDistance,
  mode = 'follow',
  radarScene = null,
  frameRadius = 0,
}: LaunchCameraControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const follow = mode === 'follow'

  // Suivi King : actif seulement en mode 'follow' (sinon ne touche pas la caméra).
  useOrbitTargetFollow({ controlsRef, rocketRef, flying, armed, enabled: follow })
  // Vue radar / vue large : chacune active seulement dans son mode.
  useRadarViewCamera({ enabled: mode === 'radar', radarScene, rocketRef })
  useWideCamera({ enabled: mode === 'wide', frameRadius })
  // Verrou : caméra et cible ne passent JAMAIS sous le relief (mode follow —
  // les vues radar/wide sont posées au-dessus du sol par construction).
  useCameraGroundClamp({ controlsRef })
  // Secousse brève au décollage (appliquée en dernier sur la pose calculée).
  useLaunchShake({ flying })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={CAMERA_TARGET}
      // OrbitControls actif seulement en mode 'follow' : en radar/wide la
      // caméra est pilotée par son hook, l'utilisateur ne l'orbite pas.
      enabled={follow}
      enableDamping
      dampingFactor={0.08}
      minDistance={5}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  )
}
