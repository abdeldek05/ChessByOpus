import * as THREE from 'three'
import { useLawnTexture } from '@/three/hooks/useLawnTexture'
import { useLawnReliefGeometry } from '@/three/hooks/useLawnReliefGeometry'
import { LAWN } from '@/three/constants/lawnField'

interface LawnGroundProps {
  size: number
}

export function LawnGround({ size }: LawnGroundProps) {
  const { colorMap, normalMap, roughnessMap } = useLawnTexture(Math.round(size / LAWN.unitsPerRepeat))
  const geometry = useLawnReliefGeometry(size)

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.8, 0.8)}
        roughnessMap={roughnessMap}
        roughness={1}
        metalness={0}
        envMapIntensity={0.4}
      />
    </mesh>
  )
}
