import { useRef } from 'react'
import type * as THREE from 'three'
import { MesangeStatic } from './MesangeStatic'
import { useProjectileLaunch } from '@/three/hooks/useProjectileLaunch'

interface DecorMesangeLaunchProps {
  azimuthDeg: number
  inclinationDeg: number
  speed: number
  gravity: number
}

/**
 * Variante de `MesangeLaunch` avec vitesse/gravité paramétrables (au lieu des
 * constantes globales de launchPhysics), pour calibrer une trajectoire courte
 * et lisible dans un cadre de caméra fixe — utilisée uniquement en décor.
 */
export function DecorMesangeLaunch({ azimuthDeg, inclinationDeg, speed, gravity }: DecorMesangeLaunchProps) {
  const pivotRef = useRef<THREE.Group>(null)

  useProjectileLaunch(pivotRef, {
    speed,
    gravity,
    inclinationDeg,
    azimuthDeg,
    baseHeight: 0,
  })

  return (
    <group ref={pivotRef}>
      <MesangeStatic />
    </group>
  )
}
