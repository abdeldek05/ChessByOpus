import { useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { LaunchPhase } from '@/hooks/useLaunchSequence'

interface ChaseCameraProps {
  /** Position live de la Mesange (monde). */
  worldPosRef: RefObject<THREE.Vector3>
  phase: LaunchPhase
  controlsRef: RefObject<OrbitControlsImpl | null>
  homePosition: [number, number, number]
  homeTarget: [number, number, number]
}

const TARGET_LERP = 0.06

/**
 * Caméra totalement LIBRE (rotation/zoom/pan restent à l'utilisateur en
 * permanence, jamais désactivés) : seule la CIBLE de l'orbite recentre en
 * douceur vers la Mesange pendant le vol, pour ne pas la perdre de vue sans
 * pour autant imposer l'angle ou la distance. Au rejeu (retour à l'état armé),
 * la vue est recadrée d'un coup sur le pas de tir.
 */
export function ChaseCamera({ worldPosRef, phase, controlsRef, homePosition, homeTarget }: ChaseCameraProps) {
  const prevPhase = useRef<LaunchPhase>(phase)

  useFrame(({ camera }) => {
    const controls = controlsRef.current
    if (!controls) return

    // Rejeu : retour instantané sur la vue du pas de tir.
    if (phase === 'armed' && prevPhase.current !== 'armed') {
      camera.position.set(...homePosition)
      controls.target.set(...homeTarget)
      controls.update()
    }
    prevPhase.current = phase

    // En vol : la cible suit doucement la menace, la caméra reste libre.
    if (phase === 'flight') {
      controls.target.lerp(worldPosRef.current, TARGET_LERP)
      controls.update()
    }
  })

  return null
}
