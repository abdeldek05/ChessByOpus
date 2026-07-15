import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useRockVariants } from '@/three/hooks/useRockVariants'
import { useScatterInstances } from '@/three/hooks/useScatterInstances'
import {
  ROCK_COLORS,
  ROCK_VARIANT_COUNT,
  ROCK_BASE_RADIUS,
  ROCK_VARIANT_SEED,
  ROCK_SCATTER,
} from '@/three/constants/rocks'
import type { SceneBiome } from '@/types/scene.types'

interface RockFieldProps {
  /** Biome du terrain : chaque rocher se pose sur le sol correspondant. */
  biome?: SceneBiome
  /** Rayon du terrain (= bord du scénario) — plafonne la portée du semis. */
  terrainRadius: number
}

/**
 * Rochers procéduraux SEMÉS sur toute la map (comme l'herbe/les chênes) :
 * quelques FORMES distinctes (useRockVariants) instanciées en masse à de
 * nombreuses positions (useScatterInstances), au lieu d'une liste de rochers
 * fixes. Chaque instance du semis est assignée à une variante par son index
 * (répartition round-robin déterministe) → un InstancedMesh par variante.
 */
export function RockField({ biome = 'meadow', terrainRadius }: RockFieldProps) {
  const geometries = useRockVariants(ROCK_VARIANT_COUNT, ROCK_BASE_RADIUS, ROCK_VARIANT_SEED)
  const matrices = useScatterInstances({
    ...ROCK_SCATTER,
    cutoffRadius: Math.min(ROCK_SCATTER.cutoffRadius, terrainRadius),
    biome,
  })

  // Répartit les matrices du semis entre les variantes (round-robin).
  const byVariant = useMemo(() => {
    const groups: THREE.Matrix4[][] = Array.from({ length: ROCK_VARIANT_COUNT }, () => [])
    matrices.forEach((m, i) => groups[i % ROCK_VARIANT_COUNT].push(m))
    return groups
  }, [matrices])

  const refs = useRef<(THREE.InstancedMesh | null)[]>([])

  useEffect(() => {
    byVariant.forEach((group, v) => {
      const mesh = refs.current[v]
      if (!mesh) return
      group.forEach((m, i) => mesh.setMatrixAt(i, m))
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    })
  }, [byVariant])

  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries])

  return (
    <group>
      {geometries.map((geometry, v) =>
        byVariant[v].length > 0 ? (
          <instancedMesh
            key={`rock-${v}-${byVariant[v].length}`}
            ref={(el) => {
              refs.current[v] = el
            }}
            args={[geometry, undefined, byVariant[v].length]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={ROCK_COLORS.light} roughness={0.95} metalness={0.02} flatShading />
          </instancedMesh>
        ) : null,
      )}
    </group>
  )
}
