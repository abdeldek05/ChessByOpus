import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Vitesses en "par seconde", indépendantes du taux de rafraîchissement de
// l'écran (sinon le mouvement vibre davantage sur les écrans 120/144 Hz).
const POINTER_SMOOTHING_PER_SEC = 9
const TILT_SMOOTHING_PER_SEC = 7
// On borne le delta : après un changement d'onglet ou une chute de frame, un
// delta géant ferait sauter le lissage d'un coup (effet "à-coup").
const MAX_DELTA = 1 / 30

/**
 * Incline légèrement la cible vers la position du curseur au-dessus du
 * canvas. Le signal de pointeur est lissé en deux temps (position, puis
 * rotation) pour absorber le bruit naturel de la souris — sur un matériau
 * réfléchissant, le moindre tremblement de rotation se voit énormément
 * dans les reflets spéculaires.
 */
export function usePointerTilt(targetRef: RefObject<THREE.Object3D | null>, maxTiltRad: number) {
  const smoothedPointer = useRef(new THREE.Vector2())

  useFrame(({ pointer }, delta) => {
    const target = targetRef.current
    if (!target) return

    const dt = Math.min(delta, MAX_DELTA)
    const pointerAlpha = Math.min(1, dt * POINTER_SMOOTHING_PER_SEC)
    smoothedPointer.current.lerp(pointer, pointerAlpha)

    const targetTiltX = -smoothedPointer.current.y * maxTiltRad
    const targetTiltZ = smoothedPointer.current.x * maxTiltRad
    const tiltAlpha = Math.min(1, dt * TILT_SMOOTHING_PER_SEC)
    target.rotation.x += (targetTiltX - target.rotation.x) * tiltAlpha
    target.rotation.z += (targetTiltZ - target.rotation.z) * tiltAlpha
  })
}
