import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const FIT_MARGIN = 1.04
const LERP_SPEED = 0.08

/**
 * Cadre `targetRef` pour qu'il reste entièrement visible. La taille est
 * mesurée UNE seule fois via la sphère englobante (invariante à la rotation),
 * puis la distance caméra reste stable : pas de "respiration" du cadrage
 * quand la fusée tourne ou s'incline. La distance est recalculée à partir du
 * rayon mémorisé seulement si le ratio du canvas change (resize), sans
 * re-parcourir la scène.
 */
export function useFitCameraToObject(
  targetRef: RefObject<THREE.Object3D | null>,
  verticalLookOffsetRatio = 0,
) {
  const radius = useRef(0)
  const center = useRef(new THREE.Vector3())
  const desiredDistance = useRef(16)
  const lastAspect = useRef(0)

  useFrame(({ camera }) => {
    const target = targetRef.current
    const perspectiveCamera = camera as THREE.PerspectiveCamera

    // Mesure unique de la sphère englobante, une fois le modèle chargé.
    if (radius.current === 0 && target) {
      const sphere = new THREE.Box3().setFromObject(target).getBoundingSphere(new THREE.Sphere())
      if (sphere.radius > 0) {
        radius.current = sphere.radius
        center.current.copy(sphere.center)
        center.current.y += sphere.radius * verticalLookOffsetRatio
      }
    }

    // Distance stable, recalculée seulement si le ratio change (resize).
    if (radius.current > 0 && perspectiveCamera.aspect !== lastAspect.current) {
      lastAspect.current = perspectiveCamera.aspect
      const verticalHalf = (perspectiveCamera.fov * Math.PI) / 360
      const horizontalHalf = Math.atan(Math.tan(verticalHalf) * perspectiveCamera.aspect)
      const fitVertical = radius.current / Math.sin(verticalHalf)
      const fitHorizontal = radius.current / Math.sin(horizontalHalf)
      desiredDistance.current = Math.max(fitVertical, fitHorizontal) * FIT_MARGIN
    }

    camera.position.z += (desiredDistance.current - camera.position.z) * LERP_SPEED
    camera.lookAt(center.current)
  })
}
