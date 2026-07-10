import { useRockGeometry } from '@/three/hooks/useRockGeometry'
import { ROCK_COLORS } from '@/three/constants/rocks'

interface RockProps {
  /** Position au sol (x, y, z) : y = hauteur du relief moins l'enfoncement. */
  position: [number, number, number]
  radius: number
  seed: number
}

/**
 * Un rocher : géométrie procédurale déformée (useRockGeometry) + matériau pierre
 * mat. Rendu seul — le placement (relief, enfoncement) est décidé par le parent.
 */
export function Rock({ position, radius, seed }: RockProps) {
  const geometry = useRockGeometry(seed, radius)
  return (
    <mesh geometry={geometry} position={position} castShadow receiveShadow>
      <meshStandardMaterial color={ROCK_COLORS.light} roughness={0.95} metalness={0.02} flatShading />
    </mesh>
  )
}
