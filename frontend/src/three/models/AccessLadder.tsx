import { DECK, DECK_TOP_Y, LADDER, RIG_COLORS } from '@/three/constants/launcherRig'
import { LADDER_TOP_X } from '@/three/constants/railingLayout'

// L'échelle part du bord avant du plateau et touche le sol : sa longueur est
// exactement DECK_TOP_Y / cos(inclinaison).
const LENGTH = DECK_TOP_Y / Math.cos(LADDER.tiltRad)
const RUNG_COUNT = Math.floor(LENGTH / LADDER.rungEvery) - 1

/**
 * Échelle d'accès en aluminium, inclinée contre la façade du plateau, alignée
 * sur l'ouverture du garde-corps.
 */
export function AccessLadder() {
  return (
    <group
      position={[LADDER_TOP_X, DECK_TOP_Y, DECK.depth / 2 + 0.02]}
      rotation={[-LADDER.tiltRad, 0, 0]}
    >
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * LADDER.width) / 2, -LENGTH / 2, 0]} castShadow>
          <cylinderGeometry args={[LADDER.railRadius, LADDER.railRadius, LENGTH, 10]} />
          <meshStandardMaterial color={RIG_COLORS.ladder} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      {Array.from({ length: RUNG_COUNT }, (_, index) => (
        <mesh
          key={index}
          position={[0, -(index + 1) * LADDER.rungEvery, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[LADDER.rungRadius, LADDER.rungRadius, LADDER.width, 8]} />
          <meshStandardMaterial color={RIG_COLORS.ladder} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}
