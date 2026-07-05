import { useLawnTexture } from '@/three/hooks/useLawnTexture'
import { LAWN } from '@/three/constants/lawnField'

interface LawnGroundProps {
  size: number
}

/**
 * Pelouse plate texturée qui s'étend jusqu'à la brume d'horizon. La texture
 * procédurale est répétée à densité constante quelle que soit la taille.
 */
export function LawnGround({ size }: LawnGroundProps) {
  const texture = useLawnTexture(Math.round(size / LAWN.unitsPerRepeat))

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  )
}
