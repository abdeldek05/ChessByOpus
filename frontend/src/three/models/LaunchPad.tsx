import { useMemo } from 'react'
import * as THREE from 'three'
import { createConcreteTexture } from '@/lib/createConcreteTexture'
import { PAD_TIERS, PAD_TOP_Y, FLAME_PIT, CONCRETE_COLOR } from '@/three/constants/launchComplex'

/**
 * Plateforme de lancement en béton, à gradins : des dalles carrées empilées du
 * plus large (socle) au plus étroit (plateau qui accueille la rampe), avec une
 * fosse d'éjection des gaz au centre. Béton texturé procédural. Compacte, à
 * l'échelle de la fusée-sonde. Rendu seul — dimensions en constantes.
 */
export function LaunchPad() {
  const { colorMap, normalMap } = useMemo(() => createConcreteTexture(512, 4), [])

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap,
        normalScale: new THREE.Vector2(0.6, 0.6),
        color: CONCRETE_COLOR,
        roughness: 0.9,
        metalness: 0.02,
      }),
    [colorMap, normalMap],
  )

  return (
    <group>
      {PAD_TIERS.map((tier, i) => {
        const prevTop = i === 0 ? 0 : PAD_TIERS[i - 1].top
        const h = tier.top - prevTop
        return (
          <mesh key={i} position={[0, prevTop + h / 2, 0]} material={material} receiveShadow castShadow>
            <boxGeometry args={[tier.half * 2, h, tier.half * 2]} />
          </mesh>
        )
      })}

      {/* Fosse d'éjection des gaz : bloc sombre encastré au centre du plateau. */}
      <mesh position={[0, PAD_TOP_Y - FLAME_PIT.depth / 2, 0]}>
        <boxGeometry args={[FLAME_PIT.half * 2, FLAME_PIT.depth, FLAME_PIT.half * 2]} />
        <meshStandardMaterial color={FLAME_PIT.color} roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}
