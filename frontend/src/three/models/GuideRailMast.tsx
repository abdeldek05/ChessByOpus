import { MAST, DECK_TOP_Y, RIG_COLORS } from '@/three/constants/launcherRig'

const RUNG_COUNT = Math.floor(MAST.height / MAST.rungEvery)

/**
 * Mât-rail vertical qui guide la fusée au décollage : deux montants en
 * profilé reliés par des entretoises, sur semelle boulonnée au plateau,
 * coiffe en tête. Il dépasse légèrement la coiffe de la fusée.
 */
export function GuideRailMast() {
  return (
    <group position={[0, DECK_TOP_Y, MAST.z]}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[MAST.spacing + 0.5, 0.06, 0.5]} />
        <meshStandardMaterial color={RIG_COLORS.mast} metalness={0.6} roughness={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * MAST.spacing) / 2, MAST.height / 2, 0]} castShadow>
          <boxGeometry args={[MAST.beam, MAST.height, MAST.beam]} />
          <meshStandardMaterial color={RIG_COLORS.mast} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: RUNG_COUNT }, (_, index) => (
        <mesh key={index} position={[0, (index + 1) * MAST.rungEvery, 0]} castShadow>
          <boxGeometry args={[MAST.spacing, 0.07, 0.05]} />
          <meshStandardMaterial color={RIG_COLORS.mast} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, MAST.height + 0.04, 0]} castShadow>
        <boxGeometry args={[MAST.spacing + 0.24, 0.08, MAST.beam + 0.1]} />
        <meshStandardMaterial color={RIG_COLORS.mast} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}
