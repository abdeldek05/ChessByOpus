import { useEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Marge de cadrage : < 1 rapproche la caméra → le modèle remplit davantage le
// cadre (les radars paraissent plus gros dans la vitrine de sélection).
const FIT_MARGIN = 0.6
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
  /** Change quand le modèle change (ex. templateId) : réarme la mesure. */
  resetKey?: string,
) {
  const radius = useRef(0)
  const center = useRef(new THREE.Vector3())
  const desiredDistance = useRef(16)
  const lastAspect = useRef(0)
  // Temporaires de mesure hissés hors de la boucle : réutilisés à chaque frame
  // tant que le modèle n'est pas stabilisé, au lieu d'allouer un Box3 + une
  // Sphere par frame.
  const scratchBox = useRef(new THREE.Box3())
  const scratchSphere = useRef(new THREE.Sphere())
  // Vrai une fois la taille du modèle stabilisée (fin du décodage Draco async).
  const settled = useRef(false)

  // Nouveau modèle : on réarme la mesure (sinon la taille reste figée sur
  // l'ancien radar → tailles incohérentes en changeant de radar).
  useEffect(() => {
    settled.current = false
    radius.current = 0
    lastAspect.current = 0
  }, [resetKey])

  useFrame(({ camera }) => {
    const target = targetRef.current
    const perspectiveCamera = camera as THREE.PerspectiveCamera

    // Mesure la sphère englobante TANT QUE le modèle n'est pas stabilisé. Les
    // GLB Draco se décodent en asynchrone : une mesure trop tôt tombe sur une
    // géométrie vide/partielle → rayon faux → taille incohérente d'un chargement
    // à l'autre. On remesure chaque frame jusqu'à ce que le rayon SE STABILISE
    // (deux mesures proches d'affilée), puis on fige.
    if (!settled.current && target) {
      const sphere = scratchBox.current.setFromObject(target).getBoundingSphere(scratchSphere.current)
      if (sphere.radius > 0) {
        // Stable si la nouvelle mesure est très proche de la précédente.
        if (Math.abs(sphere.radius - radius.current) < radius.current * 0.02) {
          settled.current = true
        }
        radius.current = sphere.radius
        center.current.copy(sphere.center)
        lastAspect.current = 0 // force le recalcul de distance avec le bon rayon
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
