import { LAUNCH_PAD_COLOR, LAUNCH_PAD_RING_COLOR, LAUNCH_PAD_HEIGHT } from '@/three/constants/launchScene'

/**
 * Aire de lancement générique et sobre (béton + anneau de repère), en
 * primitives — pas un décor de jeu, juste un socle crédible sous la Mésange.
 */
export function LaunchPad() {
  return (
    <group>
      <mesh position={[0, LAUNCH_PAD_HEIGHT / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3.2, 3.5, LAUNCH_PAD_HEIGHT, 48]} />
        <meshStandardMaterial color={LAUNCH_PAD_COLOR} roughness={0.95} metalness={0.05} />
      </mesh>

      <mesh position={[0, LAUNCH_PAD_HEIGHT + 0.01, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[2.85, 3.05, 48]} />
        <meshStandardMaterial color={LAUNCH_PAD_RING_COLOR} roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  )
}
