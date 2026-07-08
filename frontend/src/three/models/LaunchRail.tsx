import * as THREE from 'three'
import { RailBase, RAIL_PIVOT_TOP } from './RailBase'
import { RailBoom } from './RailBoom'
import { MesangeStatic } from './MesangeStatic'
import { snapLaunchAngle } from '@/lib/snapLaunchAngle'
import { RAIL } from '@/three/constants/launchRail'
import { ROCKET_FALLBACK_HALF_HEIGHT } from '@/three/constants/launcherRig'

interface LaunchRailProps {
  /** Inclinaison demandée (deg) : la rampe se cale sur l'angle connu le plus proche. */
  inclinationDeg: number
  /** Azimut de tir (deg) : oriente la rampe vers la direction de tir (0 = Nord/-Z). */
  azimuthDeg: number
}

// La Mesange est plaquée devant le fût (face de tir), un peu en avant du treillis.
const ROCKET_FRONT_OFFSET = -(RAIL.boomWidth / 2 + 0.35)

/**
 * Rampe de tir en treillis inclinée, déployable. Le fût s'articule sur le bloc
 * de pivot de la base ; son angle est calé sur l'angle connu le plus proche
 * (90/70/45), tandis que le vrai tir utilisera l'angle exact. La Mesange est
 * dressée le long du fût, base au pivot. L'ensemble est orienté vers l'azimut.
 */
export function LaunchRail({ inclinationDeg, azimuthDeg }: LaunchRailProps) {
  const snapped = snapLaunchAngle(inclinationDeg)
  // Inclinaison depuis la verticale : 90° → 0 (droit), 45° → 45° de bascule.
  const tiltRad = THREE.MathUtils.degToRad(90 - snapped)
  const azimuthRad = THREE.MathUtils.degToRad(azimuthDeg)

  return (
    <group rotation={[0, -azimuthRad, 0]}>
      <RailBase />

      {/* Fût + Mesange basculent ensemble autour du sommet du pivot. */}
      <group position={[0, RAIL_PIVOT_TOP, 0]} rotation={[-tiltRad, 0, 0]}>
        <RailBoom />
        <group position={[0, ROCKET_FALLBACK_HALF_HEIGHT, ROCKET_FRONT_OFFSET]}>
          <MesangeStatic />
        </group>
      </group>
    </group>
  )
}
