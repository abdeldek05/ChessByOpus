import { useConcreteTexture } from '@/three/hooks/useConcreteTexture'
import { BLOCK } from '@/three/constants/launcherRig'
import { PIER_BLOCKS } from '@/three/constants/pierLayout'

const PIER_TEXTURE_SEED = 4242

/**
 * Les deux piliers porteurs : gros blocs béton empilés, chacun avec sa teinte
 * et son léger désalignement (voir pierLayout) pour un rendu crédible.
 */
export function ConcretePiers() {
  const texture = useConcreteTexture(PIER_TEXTURE_SEED)

  return (
    <group>
      {PIER_BLOCKS.map((block, index) => (
        <mesh
          key={index}
          position={block.position}
          rotation={[0, block.rotationY, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[BLOCK.width, BLOCK.height, BLOCK.depth]} />
          <meshStandardMaterial map={texture} color={block.tint} roughness={0.94} metalness={0} />
        </mesh>
      ))}
    </group>
  )
}
