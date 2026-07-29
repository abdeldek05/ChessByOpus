import { useMemo } from 'react'
import * as THREE from 'three'
import {
  PAD_TIERS,
  PAD_TOP_Y,
  FLAME_PIT,
  PAD_DETAILS,
  PAD_FLOODLIGHTS,
  FLOODLIGHT,
} from '@/three/constants/launchComplex'

/**
 * Détails techniques et de sécurité SUR le plateau supérieur de la plateforme :
 * rambardes galvanisées au pourtour, bandes danger jaunes autour de la fosse,
 * bollards jaunes, tuyauterie, armoires techniques et projecteurs sur mâts. Tout
 * en primitives, posé au niveau du plateau (PAD_TOP_Y). Rendu seul — cotes en
 * constantes. Crédibilise le pas de tir sans modèle externe.
 */
export function PadDetails() {
  const topHalf = PAD_TIERS[PAD_TIERS.length - 1].half // demi-côté du plateau

  // Poteaux de rambarde le long des deux bords opposés (côtés dégagés).
  const railPosts = useMemo(() => {
    const posts: [number, number][] = []
    for (let d = -topHalf + 0.5; d <= topHalf - 0.5; d += PAD_DETAILS.railingEvery) {
      posts.push([d, -topHalf + 0.3], [d, topHalf - 0.3])
    }
    return posts
  }, [topHalf])

  return (
    <group position={[0, PAD_TOP_Y, 0]}>
      {/* --- Rambardes : poteaux + 2 lisses horizontales par côté --- */}
      {railPosts.map(([x, z], i) => (
        <mesh key={i} position={[x, PAD_DETAILS.railHeight / 2, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, PAD_DETAILS.railHeight, 6]} />
          <meshStandardMaterial color={PAD_DETAILS.railColor} roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
      {[-topHalf + 0.3, topHalf - 0.3].map((z, k) =>
        [PAD_DETAILS.railHeight * 0.95, PAD_DETAILS.railHeight * 0.5].map((ry, m) => (
          <mesh key={`${k}-${m}`} position={[0, ry, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, topHalf * 2 - 1, 6]} />
            <meshStandardMaterial color={PAD_DETAILS.railColor} roughness={0.4} metalness={0.7} />
          </mesh>
        )),
      )}

      {/* --- Bandes danger jaunes autour de la fosse (anneau plat) --- */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[FLAME_PIT.half + 0.4, FLAME_PIT.half + 1.4, 24, 1]} />
        <meshStandardMaterial color={PAD_DETAILS.markingColor} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* --- Bollards jaunes aux coins du plateau --- */}
      {[
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (topHalf - 1.5), 0.5, sz * (topHalf - 1.5)]} castShadow>
          <cylinderGeometry args={[0.28, 0.32, 1, 8]} />
          <meshStandardMaterial color={PAD_DETAILS.bollardColor} roughness={0.6} metalness={0.2} />
        </mesh>
      ))}

      {/* --- Tuyauterie : deux conduites qui longent un bord --- */}
      {[-0.5, 0.2].map((zoff, i) => (
        <mesh
          key={i}
          position={[0, 0.35 + i * 0.35, topHalf - 1.4 + zoff]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.18, 0.18, topHalf * 1.6, 10]} />
          <meshStandardMaterial color={PAD_DETAILS.pipeColor} roughness={0.5} metalness={0.6} />
        </mesh>
      ))}

      {/* --- Armoire technique (panneau) posée sur le plateau --- */}
      <mesh position={[-topHalf + 2, 0.9, topHalf - 2]} castShadow>
        <boxGeometry args={[1.6, 1.8, 0.8]} />
        <meshStandardMaterial color={PAD_DETAILS.panelColor} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* --- Projecteurs sur mâts, tête inclinée vers la fusée (centre) --- */}
      {PAD_FLOODLIGHTS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, FLOODLIGHT.height / 2, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.13, FLOODLIGHT.height, 6]} />
            <meshStandardMaterial color={FLOODLIGHT.poleColor} roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, FLOODLIGHT.height, 0]} rotation={[Math.PI / 5, 0, 0]}>
            <boxGeometry args={[1, 0.5, 0.35]} />
            <meshStandardMaterial
              color={FLOODLIGHT.headColor}
              emissive={FLOODLIGHT.headColor}
              emissiveIntensity={FLOODLIGHT.headEmissive}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
