import { RAIL, RAIL_COLORS } from '@/three/constants/launchRail'

const { baseWidth, baseDepth, plateThickness, legRadius, legHeight, pivot } = RAIL
const PLATE_Y = legHeight + plateThickness / 2
const PIVOT_Y = legHeight + plateThickness + pivot.height / 2

// Hauteur du sommet du pivot : point d'articulation du fût.
export const RAIL_PIVOT_TOP = legHeight + plateThickness + pivot.height

/**
 * Cadre de base au sol de la rampe : plateau sur quatre pieds + bloc de pivot
 * où s'articule le fût-treillis. Reste à plat quel que soit l'angle du fût.
 */
export function RailBase() {
  const lx = baseWidth / 2 - legRadius * 2
  const lz = baseDepth / 2 - legRadius * 2

  return (
    <group>
      {/* Pieds */}
      {[
        [-lx, -lz],
        [lx, -lz],
        [lx, lz],
        [-lx, lz],
      ].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, legHeight / 2, z]} castShadow>
          <cylinderGeometry args={[legRadius, legRadius, legHeight, 8]} />
          {/* IBL réelle (HDRI) : reflets nets sur le métal — envMapIntensity
              relevé au-dessus du défaut (1) pour que l'acier « montre » le
              ciel, contrairement au béton/à l'herbe qui doivent rester mats. */}
          <meshStandardMaterial color={RAIL_COLORS.frame} metalness={0.65} roughness={0.4} envMapIntensity={1.2} />
        </mesh>
      ))}

      {/* Plateau */}
      <mesh position={[0, PLATE_Y, 0]} castShadow receiveShadow>
        <boxGeometry args={[baseWidth, plateThickness, baseDepth]} />
        <meshStandardMaterial color={RAIL_COLORS.plate} metalness={0.6} roughness={0.4} envMapIntensity={1.2} />
      </mesh>

      {/* Bloc de pivot */}
      <mesh position={[0, PIVOT_Y, 0]} castShadow>
        <boxGeometry args={[pivot.width, pivot.height, pivot.depth]} />
        <meshStandardMaterial color={RAIL_COLORS.pivot} metalness={0.7} roughness={0.35} envMapIntensity={1.2} />
      </mesh>
    </group>
  )
}
