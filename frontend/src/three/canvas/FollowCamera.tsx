import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TARGET_FLIGHT_EXTENT } from '@/three/constants/flightPlayback'

interface FollowCameraProps {
  /** Position monde de la fusée, mise à jour à chaque frame (null si pas en vol). */
  targetRef: React.RefObject<THREE.Vector3 | null>
  /** Actif seulement pendant le vol : sinon l'OrbitControls libre reprend. */
  active: boolean
}

// Recul/hauteur au DÉCOLLAGE (proche, on voit la fusée quitter la rampe) puis
// en fin de montée (plus loin, pour garder la fusée dans le cadre en altitude).
const BACK_NEAR = 26
const BACK_FAR = 220
const UP_NEAR = 10
const UP_FAR = 110
// Altitude (unités scène) au-delà de laquelle on est complètement « reculé ».
// Le vol est normalisé à TARGET_FLIGHT_EXTENT → on atteint le recul max un peu
// avant, pour toujours garder la fusée dans le cadre jusqu'au sommet.
const PULLBACK_ALT = TARGET_FLIGHT_EXTENT * 0.6
// Réactivité du lissage (plus haut = plus serré). Le facteur est converti en
// 1-exp(-k·dt) pour être INDÉPENDANT du framerate (mouvement doux et constant).
const POS_STIFFNESS = 2.6
const LOOK_STIFFNESS = 5

/**
 * Caméra cinématique qui SUIT la fusée : proche et basse au décollage, elle
 * RECULE et monte à mesure que la fusée grimpe. Le lissage est indépendant du
 * framerate (amortissement exponentiel) → mouvement fluide sans saccade ni saut,
 * quel que soit le FPS. Ne prend le contrôle que quand `active` ; hors vol,
 * l'OrbitControls garde la main.
 */
export function FollowCamera({ targetRef, active }: FollowCameraProps) {
  const lookAt = useRef(new THREE.Vector3())
  const started = useRef(false)
  const desired = useRef(new THREE.Vector3())
  const flat = useRef(new THREE.Vector3())

  useFrame(({ camera }, delta) => {
    const target = targetRef.current
    if (!active || !target) {
      started.current = false
      return
    }
    const dt = Math.min(delta, 0.05)

    // Recul progressif selon l'altitude de la fusée (proche → loin).
    const climb = Math.min(1, Math.max(0, target.y / PULLBACK_ALT))
    // Lissage en douceur (smoothstep) pour éviter un recul linéaire mécanique.
    const eased = climb * climb * (3 - 2 * climb)
    const back = BACK_NEAR + (BACK_FAR - BACK_NEAR) * eased
    const up = UP_NEAR + (UP_FAR - UP_NEAR) * eased

    // Direction horizontale caméra→fusée (garde un angle stable, pas vertical).
    flat.current.set(camera.position.x - target.x, 0, camera.position.z - target.z)
    if (flat.current.lengthSq() < 1e-4) flat.current.set(0, 0, 1)
    flat.current.normalize()

    // Position voulue : en retrait horizontal + en hauteur.
    desired.current.set(
      target.x + flat.current.x * back,
      target.y + up,
      target.z + flat.current.z * back,
    )

    if (!started.current) {
      // Premier frame : cadrage direct (évite un grand balayage initial).
      camera.position.copy(desired.current)
      lookAt.current.copy(target)
      started.current = true
    } else {
      // Amortissement exponentiel indépendant du framerate.
      const posT = 1 - Math.exp(-POS_STIFFNESS * dt)
      const lookT = 1 - Math.exp(-LOOK_STIFFNESS * dt)
      camera.position.lerp(desired.current, posT)
      lookAt.current.lerp(target, lookT)
    }

    camera.lookAt(lookAt.current)
  })

  return null
}
