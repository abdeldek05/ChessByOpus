import { useMemo } from 'react'
import * as THREE from 'three'
import { createConcreteTexture } from '@/lib/createConcreteTexture'
import { ROADS, CONCRETE_COLOR, PAD_TIERS } from '@/three/constants/launchComplex'

/**
 * Voies béton qui rayonnent depuis la plateforme vers les installations. Chaque
 * voie est une bande plate posée au ras du sol, orientée selon son cap, partant
 * du bord du socle. Béton texturé procédural (joints plus rapprochés qu'au sol).
 * Rendu seul — tracés en constantes.
 */
export function LaunchRoads() {
  const { colorMap, normalMap } = useMemo(() => createConcreteTexture(256, 2), [])
  const socleHalf = PAD_TIERS[0].half

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap,
        normalScale: new THREE.Vector2(0.5, 0.5),
        color: CONCRETE_COLOR,
        roughness: 0.92,
        metalness: 0.02,
      }),
    [colorMap, normalMap],
  )

  return (
    <group>
      {ROADS.map((road, i) => {
        const a = (road.angleDeg * Math.PI) / 180
        // Centre de la voie : depuis le bord du socle, sur la moitié de sa longueur.
        const start = socleHalf
        const cx = Math.cos(a) * (start + road.length / 2)
        const cz = Math.sin(a) * (start + road.length / 2)
        return (
          <mesh
            key={i}
            position={[cx, 0.08, cz]}
            rotation={[-Math.PI / 2, 0, -a]}
            material={material}
            receiveShadow
          >
            <planeGeometry args={[road.length, road.width]} />
          </mesh>
        )
      })}
    </group>
  )
}
