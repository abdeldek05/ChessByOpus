import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createGroundMacroTexture } from '@/lib/createGroundMacroTexture'
import { DETAIL_RADIUS } from '@/lib/sceneScale'
import type { LawnTextures } from '@/three/hooks/useLawnTexture'

// Couleurs vers lesquelles l'herbe verte tend quand la macro-sécheresse monte.
const DRY_COLOR = new THREE.Color('#9c8348') // herbe sèche / paille
const DIRT_COLOR = new THREE.Color('#6b5638') // terre nue
// Rayon monde sur lequel la macro-texture s'étale (0→1) : couvre TOUTE la map
// (le sol est un seul grand plan). En dehors, ClampToEdge garde la teinte du
// bord — pas de coupure nette.
const MACRO_WORLD_RADIUS = DETAIL_RADIUS * 2

/**
 * Matériau du sol détaillé : herbe tuilée (LawnTextures) modulée par une
 * MACRO-texture de sécheresse à grande échelle (grandes plaques vertes / sèches
 * / terre, non répétées). Patch minimal sur MeshStandardMaterial via
 * onBeforeCompile — les ombres/lumières standard restent intactes ; on ne fait
 * qu'assombrir/jaunir l'albédo selon la position MONDE du fragment.
 */
export function useGroundMaterial(lawn: LawnTextures): THREE.MeshStandardMaterial {
  const macroTex = useMemo(() => createGroundMacroTexture(), [])

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: lawn.colorMap,
      normalMap: lawn.normalMap,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughnessMap: lawn.roughnessMap,
      roughness: 1,
      metalness: 0,
      // IBL réelle (HDRI) : le sol organique (herbe/terre) ne doit quasiment
      // pas réfléchir le ciel (contraste avec le métal de la rampe, voir
      // RailBase/RailBoom) — sinon la prairie a l'air humide/vernie.
      envMapIntensity: 0.35,
    })

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uMacroTex = { value: macroTex }
      shader.uniforms.uMacroRadius = { value: MACRO_WORLD_RADIUS }
      shader.uniforms.uDryColor = { value: DRY_COLOR }
      shader.uniforms.uDirtColor = { value: DIRT_COLOR }

      // On a besoin de la position MONDE dans le fragment → on la passe du vertex.
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
        .replace(
          '#include <worldpos_vertex>',
          '#include <worldpos_vertex>\n  vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
        )

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           varying vec3 vWorldPos;
           uniform sampler2D uMacroTex;
           uniform float uMacroRadius;
           uniform vec3 uDryColor;
           uniform vec3 uDirtColor;`,
        )
        // Juste après l'échantillonnage de la map (diffuseColor), on module.
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
           {
             vec2 macroUv = vWorldPos.xz / (uMacroRadius * 2.0) + 0.5;
             float dryness = texture2D(uMacroTex, macroUv).r;
             // 0..0.6 : verdissement → jaunissement ; 0.6..1 : jaune → terre.
             vec3 dryMix = mix(diffuseColor.rgb, uDryColor, smoothstep(0.0, 0.6, dryness));
             diffuseColor.rgb = mix(dryMix, uDirtColor, smoothstep(0.6, 1.0, dryness));
           }`,
        )
    }

    return mat
  }, [lawn, macroTex])

  useEffect(() => () => {
    material.dispose()
    macroTex.dispose()
  }, [material, macroTex])

  return material
}
