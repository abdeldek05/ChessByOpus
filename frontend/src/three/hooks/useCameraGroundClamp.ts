import { useFrame } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { sampleSceneGround } from '@/lib/sampleSceneGround'
import type { SceneBiome } from '@/types/scene.types'

// Hauteur minimale de la caméra au-dessus du relief (unités scène) et marge de
// la cible : on ne peut JAMAIS passer sous la map, ni en orbite, ni en pan.
const CAMERA_MARGIN = 1.6
const TARGET_MARGIN = 0.3

interface UseCameraGroundClampParams {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  /** Biome du terrain (prairie/dunes) : détermine le sol de référence. */
  biome?: SceneBiome
}

/**
 * Verrouille la caméra AU-DESSUS du terrain : à chaque frame, si la caméra (ou
 * la cible des contrôles, déplaçable au pan) passe sous le relief échantillonné
 * à sa verticale, elle est remontée à la marge. Fonctionne avec les collines
 * (le relief est échantillonné, pas un plan fixe) — plus aucun passage sous la map.
 */
export function useCameraGroundClamp({ controlsRef, biome = 'meadow' }: UseCameraGroundClampParams) {
  useFrame(({ camera }) => {
    const groundAtCamera =
      sampleSceneGround(camera.position.x, camera.position.z, biome) + CAMERA_MARGIN
    if (camera.position.y < groundAtCamera) camera.position.y = groundAtCamera

    const controls = controlsRef.current
    if (!controls) return
    const groundAtTarget =
      sampleSceneGround(controls.target.x, controls.target.z, biome) + TARGET_MARGIN
    if (controls.target.y < groundAtTarget) controls.target.y = groundAtTarget
  })
}
