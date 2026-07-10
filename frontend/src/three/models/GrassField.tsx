import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three-stdlib'
import { createGrassTexture } from '@/lib/createGrassTexture'
import { useGrassInstances } from '@/three/hooks/useGrassInstances'
import { GrassChunk } from './GrassChunk'

interface GrassFieldProps {
  /** Rayon de semis (= tout le terrain visible) — l'herbe couvre toute la map. */
  radius: number
}

/**
 * Champ d'herbe instancié couvrant TOUT le terrain : touffes en plans croisés
 * texturés alpha, découpées en SECTEURS frustum-cullés (GrassChunk) — seuls les
 * secteurs dans le champ de la caméra sont dessinés. Matériau en passe OPAQUE
 * (alphaTest seul, pas de tri de transparence) : rendu identique, GPU soulagé.
 * Géométrie et matériau partagés entre tous les secteurs, possédés ici.
 */
export function GrassField({ radius }: GrassFieldProps) {
  const chunks = useGrassInstances(radius)
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
      {chunks.map((matrices, index) =>
        matrices.length > 0 ? (
          <GrassChunk key={index} matrices={matrices} geometry={geometry} material={material} />
        ) : null,
      )}
    </>
  )
}
