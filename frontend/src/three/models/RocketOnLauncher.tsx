import { useRef } from 'react'
import type * as THREE from 'three'
import { MesangeStatic } from './MesangeStatic'
import { useRestOnSurface } from '@/three/hooks/useRestOnSurface'
import { DECK_TOP_Y, ROCKET_POSITION, ROCKET_FALLBACK_HALF_HEIGHT } from '@/three/constants/launcherRig'

/**
 * Mesange dressée sur le plateau, plaquée contre le mât-rail. La position
 * verticale n'est pas codée en dur : useRestOnSurface mesure la bounding box
 * réelle du modèle chargé et pose sa base exactement sur la tôle du plateau.
 */
export function RocketOnLauncher() {
  const seatRef = useRef<THREE.Group>(null)
  useRestOnSurface(seatRef, DECK_TOP_Y)

  return (
    <group
      ref={seatRef}
      position={[ROCKET_POSITION.x, DECK_TOP_Y + ROCKET_FALLBACK_HALF_HEIGHT, ROCKET_POSITION.z]}
    >
      <MesangeStatic />
    </group>
  )
}
