import { useMemo } from 'react'
import * as THREE from 'three'
import { createSeededRandom } from '@/lib/createSeededRandom'
import { sampleLawnRelief } from '@/lib/sampleLawnRelief'
import {
  BLADE_COUNT,
  PATCH_RADIUS,
  PATCH_INNER_RADIUS,
  BLADE_WIDTH,
  BLADE_HEIGHT,
  BLADE_HEIGHT_VARIANCE,
  BLADE_SEED,
  WIND_STRENGTH,
  BLADE_COLOR_BASE,
  BLADE_COLOR_TIP,
} from '@/three/constants/grassBlades'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'

export interface GrassBladeField {
  geometry: THREE.PlaneGeometry
  material: THREE.MeshStandardMaterial
  instanceMatrices: THREE.InstancedBufferAttribute
  count: number
  windUniform: { value: number }
}

/**
 * Construit le champ de brins d'herbe instanciés une seule fois :
 * - une géométrie de brin (plan étroit, pivot en bas pour plier par le haut) ;
 * - un MeshStandardMaterial (éclairé + ombré par le soleil de la scène) dont le
 *   vertex shader est enrichi via onBeforeCompile pour courber les brins au
 *   vent et teinter la pointe plus clair que la base ;
 * - les matrices d'instances, chaque brin semé sur le relief autour de la base
 *   (couronne PATCH_INNER_RADIUS → PATCH_RADIUS), avec hauteur et orientation
 *   variées.
 * L'uniform de temps (windUniform) est avancé par useFrame côté modèle.
 */
export function useGrassBladeField(): GrassBladeField {
  return useMemo(() => {
    // Brin : plan haut, pivot ramené à la base (translate +H/2) pour que la
    // flexion s'applique depuis le sol.
    const geometry = new THREE.PlaneGeometry(BLADE_WIDTH, BLADE_HEIGHT, 1, 4)
    geometry.translate(0, BLADE_HEIGHT / 2, 0)

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(BLADE_COLOR_BASE),
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0,
    })

    const windUniform = { value: 0 }
    const tipColor = new THREE.Color(BLADE_COLOR_TIP)

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = windUniform
      shader.uniforms.uWindStrength = { value: WIND_STRENGTH }
      shader.uniforms.uBladeHeight = { value: BLADE_HEIGHT }
      shader.uniforms.uTipColor = { value: tipColor }

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform float uWindTime;
           uniform float uWindStrength;
           uniform float uBladeHeight;
           varying float vHeightFactor;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           // hauteur normalisée du sommet dans le brin (0 base, 1 pointe).
           // La géométrie locale monte de 0 à uBladeHeight ; le scale Y de
           // l'instance s'ajoute par-dessus mais le ratio reste valable.
           vHeightFactor = clamp(transformed.y / max(uBladeHeight, 0.0001), 0.0, 1.0);
           // phase propre à l'instance via sa position monde d'ancrage
           float phase = instanceMatrix[3][0] * 0.7 + instanceMatrix[3][2] * 0.9;
           float sway = sin(uWindTime + phase) * uWindStrength;
           // flexion croissante vers la pointe (facteur²)
           float bend = vHeightFactor * vHeightFactor;
           transformed.x += sway * bend;
           transformed.z += cos(uWindTime * 0.8 + phase) * uWindStrength * 0.5 * bend;`,
        )

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform vec3 uTipColor;
           varying float vHeightFactor;`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
           diffuseColor.rgb = mix(diffuseColor.rgb, uTipColor, vHeightFactor);`,
        )
    }

    const rand = createSeededRandom(BLADE_SEED)
    const matrices = new Float32Array(BLADE_COUNT * 16)
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    const ring = PATCH_RADIUS - PATCH_INNER_RADIUS

    for (let i = 0; i < BLADE_COUNT; i++) {
      // Semis uniforme sur la couronne (sqrt pour équirépartir en surface),
      // en coordonnées MONDE autour du banc de tir décalé.
      const angle = rand() * Math.PI * 2
      const radius = PATCH_INNER_RADIUS + Math.sqrt(rand()) * ring
      const x = LAUNCH_CENTER[0] + Math.cos(angle) * radius
      const z = LAUNCH_CENTER[2] + Math.sin(angle) * radius
      const y = sampleLawnRelief(x, z)

      position.set(x, y, z)
      quaternion.setFromAxisAngle(up, rand() * Math.PI * 2)
      const heightScale = 1 + (rand() - 0.5) * 2 * BLADE_HEIGHT_VARIANCE
      scale.set(0.7 + rand() * 0.6, heightScale, 1)
      matrix.compose(position, quaternion, scale)
      matrix.toArray(matrices, i * 16)
    }

    const instanceMatrices = new THREE.InstancedBufferAttribute(matrices, 16)

    return { geometry, material, instanceMatrices, count: BLADE_COUNT, windUniform }
  }, [])
}
