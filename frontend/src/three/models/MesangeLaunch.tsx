import { useRef } from 'react'
import type * as THREE from 'three'
import { MesangeStatic } from './MesangeStatic'
import { useProjectileLaunch } from '@/three/hooks/useProjectileLaunch'
import { MESANGE_GROUND_LIFT } from '@/three/constants/launchSceneOffsets'
import { LAUNCH_PAD_HEIGHT } from '@/three/constants/launchScene'
import { LAUNCH_SPEED, LAUNCH_GRAVITY } from '@/three/constants/launchPhysics'

interface MesangeLaunchProps {
  inclinationDeg: number
  azimuthDeg: number
}

/**
 * Une Mesange en vol balistique (placeholder). Le pivot porte la trajectoire
 * et l'orientation ; le décalage interne pose la base de la fusée sur le
 * pivot pour qu'elle pointe dans son sens de déplacement.
 */
export function MesangeLaunch({ inclinationDeg, azimuthDeg }: MesangeLaunchProps) {
  const pivotRef = useRef<THREE.Group>(null)

  useProjectileLaunch(pivotRef, {
    speed: LAUNCH_SPEED,
    gravity: LAUNCH_GRAVITY,
    inclinationDeg,
    azimuthDeg,
    baseHeight: LAUNCH_PAD_HEIGHT,
  })

  return (
    <group ref={pivotRef} position={[0, LAUNCH_PAD_HEIGHT, 0]}>
      <group position={[0, MESANGE_GROUND_LIFT, 0]}>
        <MesangeStatic />
      </group>
    </group>
  )
}
