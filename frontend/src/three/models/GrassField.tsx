import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three-stdlib'
import { createGrassTexture } from '@/lib/createGrassTexture'
import { useGrassTiles } from '@/three/hooks/useGrassTiles'
import { GrassTile } from './GrassTile'
import type { SceneBiome } from '@/types/scene.types'

interface GrassFieldProps {
  biome: SceneBiome
}

/**
 * Champ d'herbe DENSE PARTOUT sur la map, par STREAMING DE TUILES autour de la
 * caméra (useGrassTiles) : seules les tuiles proches de la caméra existent à
 * un instant donné, donc le coût reste borné même si la caméra parcourt des
 * dizaines de km — l'herbe est aussi dense loin du pas de tir qu'à côté.
 * Matériau en passe OPAQUE (alphaTest seul, pas de tri de transparence).
 * Géométrie et matériau partagés entre toutes les tuiles, possédés ici.
 */
export function GrassField({ biome }: GrassFieldProps) {
  const tiles = useGrassTiles()
  const texture = useMemo(() => createGrassTexture(), [])

  // Géométrie : deux plans perpendiculaires, pivot ramené à la base (y ∈ [0,1]).
  const geometry = useMemo(() => {
    const a = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)
    const b = new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2).translate(0, 0.5, 0)
    return mergeBufferGeometries([a, b])!
  }, [])

  // Matériau partagé : PAS de `transparent` → l'herbe passe dans la passe
  // opaque (alphaTest découpe les contours) : plus de tri par frame.
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        alphaTest: 0.4,
        side: THREE.DoubleSide,
        roughness: 0.9,
        metalness: 0,
      }),
    [texture],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      texture.dispose()
    },
    [geometry, material, texture],
  )

  return (
    <>
      {tiles.map(({ tileX, tileZ }) => (
        <GrassTile
          key={`${tileX}:${tileZ}`}
          tileX={tileX}
          tileZ={tileZ}
          biome={biome}
          geometry={geometry}
          material={material}
        />
      ))}
    </>
  )
}
