import { sampleLawnRelief } from '@/lib/sampleLawnRelief'
import { BUILDINGS } from '@/three/constants/launchComplex'

/**
 * Bâtiments techniques du complexe (blockhaus, hangar) : simples volumes posés
 * au ras du relief à leur position. Rendu seul — positions/tailles en constantes.
 */
export function ComplexBuildings() {
  return (
    <group>
      {BUILDINGS.map((b, i) => {
        const [x, z] = b.pos
        const [w, h, d] = b.size
        const y = sampleLawnRelief(x, z)
        return (
          <mesh key={i} position={[x, y + h / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={b.color} roughness={0.8} metalness={0.1} />
          </mesh>
        )
      })}
    </group>
  )
}
