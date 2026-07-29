import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MATERIAL_REFLECTIVITY_OVERRIDES } from '@/three/constants/materialOverrides'
import { CARBON_FIBER_MATERIAL_NAMES } from '@/three/constants/carbonMaterialNames'
import { createCarbonFiberTexture } from '@/lib/createCarbonFiberTexture'
import { PHOTO_MODE } from '@/three/constants/photoMode'

// Rendu maximal (voir feedback_gpu_budget) : anisotropie au plafond matériel
// courant, reflets IBL plus présents sur la fusée — le gros plan au
// décollage doit tenir la comparaison avec une vraie surface métal/composite.
// En MODE PHOTO : anisotropie doublée (netteté des textures à angle rasant, ce
// qui compte sur un fuselage cylindrique vu de profil) et reflets d'environnement
// nettement montés — la fusée doit accrocher le soleil et le ciel de l'HDRI en
// gros plan, pas rester d'un métal terne.
const ANISOTROPY = PHOTO_MODE ? 32 : 16
const ENV_MAP_INTENSITY = PHOTO_MODE ? 1.7 : 1.2
const REFLECTIVE_ENV_MAP_INTENSITY = PHOTO_MODE ? 2.6 : 1.85

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
  const gl = useThree((state) => state.gl)

  useLayoutEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy()
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

        // `maxAnisotropy` borne la valeur au plafond réel du GPU : au-delà,
        // WebGL ignore la demande (et l'implémentation peut avertir) — inutile
        // de réclamer 32 sur un pilote qui plafonne à 16.
        const anisotropy = Math.min(ANISOTROPY, maxAnisotropy)
        ;[standard.map, standard.normalMap, standard.roughnessMap, standard.metalnessMap].forEach((texture) => {
          if (texture) texture.anisotropy = anisotropy
        })
      })
    })
  }, [scene, gl])
}
