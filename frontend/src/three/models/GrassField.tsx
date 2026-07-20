import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three-stdlib'
import { createGrassTexture } from '@/lib/createGrassTexture'
import { useGrassTiles } from '@/three/hooks/useGrassTiles'
import { GRASS_STREAM_RADIUS } from '@/three/constants/grassField'
import { GrassTile } from './GrassTile'

// Le fondu commence à cette fraction du rayon de streaming : avant, herbe pleine
// hauteur ; entre fadeStart et le bord, les touffes rapetissent jusqu'à 0 —
// plus de « mur » net à la limite d'affichage.
const FADE_START_FRAC = 0.7

/**
 * Champ d'herbe DENSE PARTOUT sur la map, par STREAMING DE TUILES autour de la
 * caméra (useGrassTiles) : seules les tuiles proches de la caméra existent à
 * un instant donné, donc le coût reste borné même si la caméra parcourt des
 * dizaines de km — l'herbe est aussi dense loin du pas de tir qu'à côté.
 * Matériau en passe OPAQUE (alphaTest seul, pas de tri de transparence).
 * Les touffes RAPETISSENT vers le bord du rayon (fondu, cf. patch shader).
 * Géométrie et matériau partagés entre toutes les tuiles, possédés ici.
 */
export function GrassField() {
  const tiles = useGrassTiles()
  const texture = useMemo(() => createGrassTexture(), [])
  // Uniform mis à jour chaque frame : position caméra (pour le fondu par distance).
  const camPos = useRef(new THREE.Vector3())

  // Géométrie : deux plans perpendiculaires, pivot ramené à la base (y ∈ [0,1]).
  const geometry = useMemo(() => {
    const a = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)
    const b = new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2).translate(0, 0.5, 0)
    return mergeBufferGeometries([a, b])!
  }, [])

  // Matériau partagé : passe OPAQUE (alphaTest). Patché pour que les touffes
  // rapetissent (fondu) à l'approche du bord du rayon de streaming.
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0,
      // IBL réelle (HDRI) : brins d'herbe quasi mats (voir useGroundMaterial).
      envMapIntensity: 0.3,
    })
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uCamXZ = { value: camPos.current }
      shader.uniforms.uFadeStart = { value: GRASS_STREAM_RADIUS * FADE_START_FRAC }
      shader.uniforms.uFadeEnd = { value: GRASS_STREAM_RADIUS }
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform vec3 uCamXZ;
           uniform float uFadeStart;
           uniform float uFadeEnd;`,
        )
        // Normale forcée VERTICALE (monde), APRÈS l'application de
        // instanceMatrix (defaultnormal_vertex) : sans ça, la normale du plan
        // croisé tourne avec la rotation aléatoire de chaque instance — deux
        // plans à 90° reçoivent alors la lumière très différemment selon leur
        // orientation (patchwork de touffes claires/sombres, aspect « carton
        // plat »). Une normale verticale uniforme (recalculée en espace vue,
        // comme le fait normalMatrix) diffuse la lumière comme un vrai brin
        // d'herbe, quelle que soit sa rotation — look cohérent et doux partout.
        .replace(
          '#include <defaultnormal_vertex>',
          `#include <defaultnormal_vertex>
           transformedNormal = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));`,
        )
        // La base de l'instance (colonne de translation de instanceMatrix) donne
        // sa position monde ; on rétrécit le vertex vers cette base selon la
        // distance horizontale à la caméra.
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           {
             vec3 instBase = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
             float d = distance(instBase.xz, uCamXZ.xz);
             float shrink = 1.0 - smoothstep(uFadeStart, uFadeEnd, d);
             // Rapetisse la touffe vers sa base (y local ∈ [0,1] après pivot).
             transformed.y *= shrink;
             transformed.x *= shrink;
             transformed.z *= shrink;
           }`,
        )
    }
    return mat
  }, [texture])

  useFrame(({ camera }) => {
    camPos.current.copy(camera.position)
  })

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
          geometry={geometry}
          material={material}
        />
      ))}
    </>
  )
}
