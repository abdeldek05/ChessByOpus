import { useMemo } from 'react'
import * as THREE from 'three'
import { sampleGroundHeight } from '@/lib/sampleGroundHeight'
import { useLawnTexture } from '@/three/hooks/useLawnTexture'
import { useGroundMaterial } from '@/three/hooks/useGroundMaterial'
import { FAR_GROUND_RADIUS } from '@/lib/sceneScale'

// Subdivisions du sol : assez pour porter le relief (grandes collines +
// détail) partout. 512² ≈ 0.5M triangles, quad ~234 u sur le sol entier — les
// grandes collines (longueur d'onde 22000) restent lisses, le détail fin
// ressort près de la caméra. Dans le budget GPU (cf. mémoire projet).
const SEGMENTS = 512

// Combien d'unités scène couvre UNE tuile de texture d'herbe : plus petit =
// herbe plus fine mais motif plus vite répété.
const UNITS_PER_TILE = 35

/**
 * Sol de la scène : UN SEUL grand plan (pas de double couche qui se chevauche →
 * plus de z-fighting), texturé en HERBE procédurale tuilée + modulé par une
 * MACRO-texture de sécheresse à grande échelle (grandes plaques vertes / sèches
 * / terre) qui couvre TOUTE la map. Déplacé en hauteur par `sampleGroundHeight`
 * (relief, actuellement plat) — la SEULE fonction de relief, partagée avec la
 * future collision de la fusée.
 */
export function GroundMesh() {
  const geometry = useMemo(() => {
    const size = FAR_GROUND_RADIUS * 2
    const geo = new THREE.PlaneGeometry(size, size, SEGMENTS, SEGMENTS)
    const positions = geo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      positions.setZ(i, sampleGroundHeight(x, -y))
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  // Herbe tuilée : densité constante sur TOUT le sol (repeat calé sur sa vraie
  // taille) → herbe fine partout, pas d'étirement flou au loin. La répétition
  // du motif est cassée par la macro-texture (grandes plaques) + le fog.
  const tiles = Math.max(1, Math.round((FAR_GROUND_RADIUS * 2) / UNITS_PER_TILE))
  const lawn = useLawnTexture(tiles)
  // Matériau : herbe tuilée + macro-plaques sèches/terre sur toute la map.
  const material = useGroundMaterial(lawn)

  return <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} material={material} receiveShadow />
}
