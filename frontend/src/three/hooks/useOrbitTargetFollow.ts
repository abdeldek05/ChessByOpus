import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { CAMERA_TARGET } from '@/three/constants/sceneLayout'

// Réactivité du suivi (vol) et douceur du retour au pad (fin de vol), converties
// en 1-exp(-k·dt) : lissage INDÉPENDANT du framerate (fluide quel que soit le FPS).
const FOLLOW_STIFFNESS = 5
const RETURN_STIFFNESS = 1.4
// Pause avant le retour caméra vers le pad (le temps de voir l'impact).
const RETURN_DELAY_SEC = 1.4
// Distance² sous laquelle le retour est considéré terminé.
const RETURN_DONE_SQ = 0.05

interface UseOrbitTargetFollowParams {
  /** Contrôles orbite (drei) dont on pilote la cible. */
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  /** Position monde de la fusée en vol (null hors vol). */
  rocketRef: React.RefObject<THREE.Vector3 | null>
  /** Vol en cours : la cible suit la fusée. */
  flying: boolean
}

/**
 * Fait suivre la CIBLE des OrbitControls à la fusée pendant le vol : la cible
 * glisse vers la fusée (lissage exponentiel) et la caméra est translatée du
 * MÊME delta — le cadrage choisi par l'utilisateur est préservé, et il garde
 * l'orbite/zoom libres en plein vol. À la fin du vol, après une courte pause
 * sur l'impact, la cible revient en douceur vers le pas de tir. Un seul système
 * caméra, aucune transition brutale.
 */
export function useOrbitTargetFollow({ controlsRef, rocketRef, flying }: UseOrbitTargetFollowParams) {
  const shift = useRef(new THREE.Vector3())
  const home = useRef(new THREE.Vector3(...CAMERA_TARGET))
  const wasFlying = useRef(false)
  const returning = useRef(false)
  const returnWait = useRef(0)

  useFrame(({ camera }, delta) => {
    const controls = controlsRef.current
    if (!controls) return
    const dt = Math.min(delta, 0.05) // borne anti-saut après un lag

    if (flying && rocketRef.current) {
      wasFlying.current = true
      returning.current = false
      // La cible glisse vers la fusée ; la caméra suit du même delta.
      const t = 1 - Math.exp(-FOLLOW_STIFFNESS * dt)
      shift.current.copy(rocketRef.current).sub(controls.target).multiplyScalar(t)
      controls.target.add(shift.current)
      camera.position.add(shift.current)
      return
    }

    // Fin de vol : petite pause sur l'impact, puis retour doux vers le pad.
    if (wasFlying.current) {
      wasFlying.current = false
      returning.current = true
      returnWait.current = RETURN_DELAY_SEC
    }
    if (!returning.current) return

    if (returnWait.current > 0) {
      returnWait.current -= dt
      return
    }
    const t = 1 - Math.exp(-RETURN_STIFFNESS * dt)
    shift.current.copy(home.current).sub(controls.target).multiplyScalar(t)
    controls.target.add(shift.current)
    camera.position.add(shift.current)
    if (controls.target.distanceToSquared(home.current) < RETURN_DONE_SQ) {
      returning.current = false
    }
  })
}
