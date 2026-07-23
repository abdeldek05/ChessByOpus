import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { MATERIAL_REFLECTIVITY_OVERRIDES } from '@/three/constants/materialOverrides'
import { CARBON_FIBER_MATERIAL_NAMES } from '@/three/constants/carbonMaterialNames'
import { createCarbonFiberTexture } from '@/lib/createCarbonFiberTexture'

// Rendu maximal (voir feedback_gpu_budget) : anisotropie au plafond matériel
// courant, reflets IBL plus présents sur la fusée — le gros plan au
// décollage doit tenir la comparaison avec une vraie surface métal/composite.
const ANISOTROPY = 16
const ENV_MAP_INTENSITY = 1.2
const REFLECTIVE_ENV_MAP_INTENSITY = 1.85

let cachedCarbonFiberTexture: THREE.CanvasTexture | null = null
function getCarbonFiberTexture(): THREE.CanvasTexture {
  if (!cachedCarbonFiberTexture) cachedCarbonFiberTexture = createCarbonFiberTexture()
  return cachedCarbonFiberTexture
}

/**
 * Affine le rendu PBR du modèle chargé : netteté des textures à angle rasant
 * (anisotropie), intensité des reflets d'environnement, et correction des
 * matériaux dont le bake Blender a laissé une rugosité/métallicité par
 * défaut (donc plats, sans reflet) — voir materialOverrides.ts.
 */
export function useMesangeMaterialQuality(scene: THREE.Group) {
  useLayoutEffect(() => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((material) => {
        const standard = material as THREE.MeshStandardMaterial
        if (!('envMapIntensity' in standard)) return

        const override = MATERIAL_REFLECTIVITY_OVERRIDES[standard.name]
        if (override) {
          if (override.metalness !== undefined) standard.metalness = override.metalness
          if (override.roughness !== undefined) standard.roughness = override.roughness
          standard.envMapIntensity = REFLECTIVE_ENV_MAP_INTENSITY
        } else {
          standard.envMapIntensity = ENV_MAP_INTENSITY
        }

        if (CARBON_FIBER_MATERIAL_NAMES.includes(standard.name)) {
          standard.map = getCarbonFiberTexture()
          standard.color.set(0xffffff)
          standard.needsUpdate = true
        }

        ;[standard.map, standard.normalMap, standard.roughnessMap, standard.metalnessMap].forEach((texture) => {
          if (texture) texture.anisotropy = ANISOTROPY
        })
      })
    })
  }, [scene])
}
