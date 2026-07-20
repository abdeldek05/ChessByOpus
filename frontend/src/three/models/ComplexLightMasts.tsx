import { sampleSceneGround } from '@/lib/sampleSceneGround'
import { LIGHT_MASTS, MAST } from '@/three/constants/launchComplex'

/**
 * Mâts d'éclairage du complexe : un poteau fin surmonté d'une tête lumineuse
 * émissive (le Bloom la fait rayonner au golden hour). Posés au sol. Rendu
 * seul — positions/hauteur en constantes.
 */
export function ComplexLightMasts() {
  return (
    <group>
      {LIGHT_MASTS.map(([x, z], i) => {
        const y = sampleSceneGround(x, z)
        return (
          <group key={i} position={[x, y, z]}>
            {/* Poteau : métal, reflet du ciel discret (voir RailBase/RailBoom). */}
            <mesh position={[0, MAST.height / 2, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.16, MAST.height, 8]} />
              <meshStandardMaterial color={MAST.poleColor} roughness={0.55} metalness={0.55} envMapIntensity={1} />
            </mesh>
            {/* Tête lumineuse émissive */}
            <mesh position={[0, MAST.height, 0.2]}>
              <boxGeometry args={[1.2, 0.4, 0.3]} />
              <meshStandardMaterial
                color={MAST.headColor}
                emissive={MAST.headColor}
                emissiveIntensity={MAST.headEmissive}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
