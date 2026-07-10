import * as THREE from 'three'
import { RailBase, RAIL_PIVOT_TOP } from './RailBase'
import { RailBoom } from './RailBoom'
import { MesangeStatic } from './MesangeStatic'
import { RAIL } from '@/three/constants/launchRail'
import { ROCKET_FALLBACK_HALF_HEIGHT } from '@/three/constants/launcherRig'

interface LaunchRailProps {
  /** Inclinaison choisie (deg, 90 = vertical) : la rampe la reproduit fidèlement. */
  inclinationDeg: number
  /** Azimut de tir (deg) : oriente la rampe vers la direction de tir (0 = Nord/-Z). */
  azimuthDeg: number
  /** Tir parti : la Mesange a quitté la rampe (elle vole), on ne la montre plus ici. */
  launched?: boolean
}

// La Mesange est plaquée devant le fût (face de tir), un peu en avant du treillis.
const ROCKET_FRONT_OFFSET = -(RAIL.boomWidth / 2 + 0.35)
// On remonte la Mesange le long du fût pour que sa BASE dépasse un peu le pivot :
// ainsi, même quand le fût bascule (jusqu'à 70°), l'extrémité basse et les
// ailerons restent au-dessus du sol au lieu de s'y enfoncer.
const ROCKET_ALONG_BOOM = ROCKET_FALLBACK_HALF_HEIGHT + 0.6

/**
 * Rampe de tir en treillis inclinée, déployable. Le fût s'articule sur le bloc
 * de pivot de la base et reproduit FIDÈLEMENT l'inclinaison choisie (angle
 * exact, au dixième de degré — plus de snapping sur des crans). La Mesange est
 * dressée le long du fût, sa base au-dessus du pivot. L'ensemble est orienté
 * vers l'azimut.
 */
export function LaunchRail({ inclinationDeg, azimuthDeg, launched = false }: LaunchRailProps) {
  // Inclinaison depuis la verticale : 90° → 0 (droit), 70° → 20° de bascule.
  const tiltRad = THREE.MathUtils.degToRad(90 - inclinationDeg)
  const azimuthRad = THREE.MathUtils.degToRad(azimuthDeg)

  return (
    <group rotation={[0, -azimuthRad, 0]}>
      <RailBase />

      {/* Fût + Mesange basculent ensemble autour du sommet du pivot. La Mesange
          disparaît une fois le tir parti (elle vole via FlyingMesange). */}
      <group position={[0, RAIL_PIVOT_TOP, 0]} rotation={[-tiltRad, 0, 0]}>
        <RailBoom />
        {!launched && (
          <group position={[0, ROCKET_ALONG_BOOM, ROCKET_FRONT_OFFSET]}>
            <MesangeStatic />
          </group>
        )}
      </group>
    </group>
  )
}
