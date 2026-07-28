import { useMemo } from 'react'
import * as THREE from 'three'
import { useVolumetricCloudMaterial } from '@/three/hooks/useVolumetricCloudMaterial'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import {
  CLOUD_LAYER_ALTITUDE_M,
  CLOUD_LAYER_THICKNESS_M,
  CLOUD_PLANE_HALF_SIZE,
} from '@/three/constants/volumetricClouds'

export interface VolumetricCloudsProps {
  /** Mètres réels par unité de scène (échelle du scénario, voir sceneScale) :
   *  convertit l'altitude et l'épaisseur RÉELLES de la couche en unités. */
  metersPerSceneUnit: number
}

/**
 * Couche de nuages volumétriques à l'altitude RÉELLE de cumulus (2 km, voir
 * CLOUD_LAYER_ALTITUDE_M) : un grand plan horizontal rendu par le shader de
 * raymarching court (voir useVolumetricCloudMaterial) — la fusée le traverse en
 * montant, on voit de vrais nuages 3D par en dessous/dedans plutôt que le fond
 * HDRI plat et infiniment lointain. Le raymarching est BORNÉ à l'épaisseur de la
 * couche (garde-fou driver AMD, voir volumetricClouds.ts).
 *
 * L'altitude est convertie depuis des MÈTRES via l'échelle du scénario : la
 * couche reste ainsi à 2 km quel que soit le radar posé, donc la fusée la
 * traverse toujours au même moment de sa montée. Avec une altitude figée en
 * unités, elle dérivait de 13 à 42 km selon le scénario.
 *
 * Monté sous <Suspense> par l'appelant (la texture de bruit se construit de
 * façon synchrone, mais le matériau reste cohérent avec les autres couches
 * atmosphériques).
 */
export function VolumetricClouds({ metersPerSceneUnit }: VolumetricCloudsProps) {
  const thicknessUnits = CLOUD_LAYER_THICKNESS_M / metersPerSceneUnit
  const altitudeUnits = CLOUD_LAYER_ALTITUDE_M / metersPerSceneUnit
  const material = useVolumetricCloudMaterial(thicknessUnits)
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(CLOUD_PLANE_HALF_SIZE * 2, CLOUD_PLANE_HALF_SIZE * 2),
    [],
  )

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[LAUNCH_CENTER[0], altitudeUnits, LAUNCH_CENTER[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  )
}
