import { DECK, DECK_BASE_Y, RIG_COLORS } from '@/three/constants/launcherRig'

/**
 * Plateau acier posé sur les piliers, raidi par deux longerons transversaux
 * visibles sous la tôle.
 */
export function LaunchDeck() {
  return (
    <group>
      <mesh position={[0, DECK_BASE_Y + DECK.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[DECK.width, DECK.height, DECK.depth]} />
        <meshStandardMaterial color={RIG_COLORS.steelDeck} metalness={0.55} roughness={0.5} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[0, DECK_BASE_Y - 0.09, side * (DECK.depth / 2 - 0.4)]}
          castShadow
        >
          <boxGeometry args={[DECK.width - 0.3, 0.18, 0.16]} />
          <meshStandardMaterial color={RIG_COLORS.beam} metalness={0.6} roughness={0.45} />
        </mesh>
      ))}
    </group>
  )
}
