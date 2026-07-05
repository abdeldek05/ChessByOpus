import { useConcreteTexture } from '@/three/hooks/useConcreteTexture'
import { SLAB, RIG_COLORS } from '@/three/constants/launcherRig'

const SLAB_TEXTURE_SEED = 902

/**
 * Dalle béton au sol sous le banc de tir, légèrement plus sombre que les
 * blocs des piliers (surface usée, balayée par les tirs).
 */
export function ConcreteSlab() {
  const texture = useConcreteTexture(SLAB_TEXTURE_SEED)

  return (
    <mesh position={[0, SLAB.height / 2, 0]} receiveShadow>
      <boxGeometry args={[SLAB.width, SLAB.height, SLAB.depth]} />
      <meshStandardMaterial map={texture} color={RIG_COLORS.slab} roughness={0.95} metalness={0} />
    </mesh>
  )
}
