import { useFrame } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { sampleSceneGround } from '@/lib/sampleSceneGround'

// Hauteur minimale de la caméra au-dessus du relief (unités scène) et marge de
// la cible : on ne peut JAMAIS passer sous la map, ni en orbite, ni en pan.
const CAMERA_MARGIN = 1.6
const TARGET_MARGIN = 0.3

// Rigidité du rattrapage : le relief (bruit fBm) varie en continu quand la
// caméra se déplace latéralement (suivi de la fusée) — un assignement SEC de
// position.y à chaque frame où le seuil est franchi fait osciller la caméra en
// dents de scie (clamp/relâche) au fil du micro-relief traversé. Amorti
// (1-exp(-k·dt), indépendant du framerate), le rattrapage lisse cette vibration
// sans jamais laisser passer la caméra sous le sol (toujours >= seuil - marge
// d'amortissement négligeable sur une frame).
const CLAMP_STIFFNESS = 18

interface UseCameraGroundClampParams {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}

/**
 * Verrouille la caméra AU-DESSUS du terrain : à chaque frame, si la caméra (ou
 * la cible des contrôles, déplaçable au pan) passe sous le relief échantillonné
 * à sa verticale, elle est ramenée à la marge (rattrapage amorti). Fonctionne
 * avec les collines (le relief est échantillonné, pas un plan fixe) — plus
 * aucun passage sous la map.
 */
export function useCameraGroundClamp({ controlsRef }: UseCameraGroundClampParams) {
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = 1 - Math.exp(-CLAMP_STIFFNESS * dt)

    const groundAtCamera = sampleSceneGround(camera.position.x, camera.position.z) + CAMERA_MARGIN
    if (camera.position.y < groundAtCamera) {
      camera.position.y += (groundAtCamera - camera.position.y) * t
    }

    const controls = controlsRef.current
    if (!controls) return
    const groundAtTarget = sampleSceneGround(controls.target.x, controls.target.z) + TARGET_MARGIN
    if (controls.target.y < groundAtTarget) {
      controls.target.y += (groundAtTarget - controls.target.y) * t
    }
  })
}
