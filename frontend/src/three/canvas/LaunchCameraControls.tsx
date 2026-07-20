import { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useOrbitTargetFollow } from '@/three/hooks/useOrbitTargetFollow'
import { useCameraGroundClamp } from '@/three/hooks/useCameraGroundClamp'
import { useLaunchShake } from '@/three/hooks/useLaunchShake'
import { CAMERA_TARGET } from '@/three/constants/sceneLayout'

interface LaunchCameraControlsProps {
  /** Position monde de la fusée en vol (null hors vol) — cible du suivi. */
  rocketRef: React.RefObject<THREE.Vector3 | null>
  /** Vol en cours : la cible des contrôles suit la fusée. */
  flying: boolean
  /** Scénario réarmé (juste après replay) : force un retour caméra instantané
   * vers le pad, sans attendre l'amortissement normal. */
  armed?: boolean
  /** Distance max de zoom (proportionnelle à la taille du terrain). */
  maxDistance: number
}

/**
 * Contrôles caméra UNIQUES de la scène de lancement : orbite/zoom/pan libres en
 * permanence (avant, PENDANT et après le vol — plus de bascule de caméra).
 * Pendant le vol, la cible suit la fusée (hook) : l'utilisateur tourne autour
 * d'elle en plein vol ; à la fin, retour doux vers le pas de tir. Le polar max
 * bloque le passage sous l'horizon.
 */
export function LaunchCameraControls({ rocketRef, flying, armed, maxDistance }: LaunchCameraControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  useOrbitTargetFollow({ controlsRef, rocketRef, flying, armed })
  // Verrou : caméra et cible ne passent JAMAIS sous le relief de la map.
  useCameraGroundClamp({ controlsRef })
  // Secousse brève au décollage (APRÈS le suivi/clamp ci-dessus dans l'ordre
  // des hooks — donc appliquée en dernier dans la frame, sur la position déjà
  // calculée par les autres, sans être écrasée).
  useLaunchShake({ flying })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={CAMERA_TARGET}
      enableDamping
      dampingFactor={0.08}
      minDistance={5}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  )
}
