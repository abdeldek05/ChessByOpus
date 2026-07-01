import { useLayoutEffect } from 'react'
import * as THREE from 'three'

/**
 * Applique une teinte uniforme aux matériaux du modèle (utile pour un GLB
 * exporté en gris neutre sans texture, comme GRF). Sans effet si `color`
 * n'est pas fourni — les modèles déjà texturés gardent leur palette.
 */
export function useMaterialTint(scene: THREE.Group, color?: string) {
  useLayoutEffect(() => {
    if (!color) return

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((material) => {
        const standard = material as THREE.MeshStandardMaterial
        if (standard.color) standard.color.set(color)
      })
    })
  }, [scene, color])
}
