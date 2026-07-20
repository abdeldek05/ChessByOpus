import { sampleSceneGround } from '@/lib/sampleSceneGround'
import { BUILDINGS } from '@/three/constants/launchComplex'

/**
 * Bâtiments techniques du complexe (blockhaus, hangar) : simples volumes posés
 * au ras du sol à leur position. Rendu seul — positions/tailles en constantes.
 */
export function ComplexBuildings() {
  return (
    <group>
      {BUILDINGS.map((b, i) => {
        const [x, z] = b.pos
        const [w, h, d] = b.size
        const y = sampleSceneGround(x, z)
        return (
          <mesh key={i} position={[x, y + h / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            {/* IBL réelle (HDRI) : bâtiments techniques mats (voir LaunchPad). */}
            <meshStandardMaterial color={b.color} roughness={0.8} metalness={0.1} envMapIntensity={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}
