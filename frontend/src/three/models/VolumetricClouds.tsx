import { useMemo } from 'react'
import * as THREE from 'three'
import { useVolumetricCloudMaterial } from '@/three/hooks/useVolumetricCloudMaterial'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { CLOUD_LAYER_ALTITUDE, CLOUD_PLANE_HALF_SIZE } from '@/three/constants/volumetricClouds'

/**
 * Couche de nuages volumétriques à hauteur de vol : un grand plan horizontal
 * au niveau CLOUD_LAYER_ALTITUDE, rendu par le shader de raymarching court
 * (voir useVolumetricCloudMaterial) — la fusée le traverse en montant, on voit
 * de vrais nuages 3D par en dessous/dedans plutôt que le fond HDRI plat et
 * infiniment lointain. Le raymarching est BORNÉ à l'épaisseur de la couche
 * (garde-fou driver AMD, voir volumetricClouds.ts). Monté sous <Suspense> par
 * l'appelant (la texture de bruit se construit de façon synchrone, mais le
 * matériau reste cohérent avec le reste des couches atmosphériques).
 */
export function VolumetricClouds() {
  const material = useVolumetricCloudMaterial()
  const geometry = useMemo(() => new THREE.PlaneGeometry(CLOUD_PLANE_HALF_SIZE * 2, CLOUD_PLANE_HALF_SIZE * 2), [])

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[LAUNCH_CENTER[0], CLOUD_LAYER_ALTITUDE, LAUNCH_CENTER[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  )
}
