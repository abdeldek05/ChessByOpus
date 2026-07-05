import * as THREE from 'three'
import { useWavedFlagGeometry } from '@/three/hooks/useWavedFlagGeometry'
import { DECK, DECK_TOP_Y, FLAG, RIG_COLORS } from '@/three/constants/launcherRig'

const CORNER: [number, number, number] = [
  DECK.width / 2 - 0.18,
  DECK_TOP_Y,
  -(DECK.depth / 2 - 0.18),
]

/**
 * Drapeau vert « zone dégagée » hissé sur le coin arrière droit du plateau,
 * légèrement ondulé comme pris dans le vent.
 */
export function WindFlag() {
  const geometry = useWavedFlagGeometry(FLAG.width, FLAG.height, FLAG.waveDepth)

  return (
    <group position={CORNER}>
      <mesh position={[0, FLAG.poleHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[FLAG.poleRadius, FLAG.poleRadius, FLAG.poleHeight, 10]} />
        <meshStandardMaterial color={RIG_COLORS.pole} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh
        geometry={geometry}
        position={[FLAG.width / 2 + FLAG.poleRadius, FLAG.poleHeight - FLAG.height / 2 - 0.05, 0]}
        castShadow
      >
        <meshStandardMaterial color={RIG_COLORS.flag} side={THREE.DoubleSide} roughness={0.85} />
      </mesh>
    </group>
  )
}
