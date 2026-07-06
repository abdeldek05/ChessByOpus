import { useLawnTexture } from '@/three/hooks/useLawnTexture'
import { useLawnReliefGeometry } from '@/three/hooks/useLawnReliefGeometry'
import { LAWN } from '@/three/constants/lawnField'

interface LawnGroundProps {
  size: number
}

export function LawnGround({ size }: LawnGroundProps) {
  const { colorMap, roughnessMap } = useLawnTexture(Math.round(size / LAWN.unitsPerRepeat))
  const geometry = useLawnReliefGeometry(size)

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial
        map={colorMap}
        roughnessMap={roughnessMap}
        roughness={0.92}
        metalness={0}
        envMapIntensity={0.35}
      />
    </mesh>
  )
}
