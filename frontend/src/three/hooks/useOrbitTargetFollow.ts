import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { CAMERA_TARGET } from '@/three/constants/sceneLayout'

// Douceur du retour au pad (fin de vol), convertie en 1-exp(-k·dt) : lissage
// INDÉPENDANT du framerate (fluide quel que soit le FPS).
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
  /** Scénario réarmé (juste après `replay()`) : force un retour INSTANTANÉ au
   * cadrage du pad, sans attendre l'amortissement normal — sinon, en cliquant
   * REPLAY avant la fin du retour doux, la caméra reste loin du pad et la
   * fusée statique (pourtant bien réaffichée) devient indiscernable à cette
   * distance/zoom (elle semble "avoir disparu"). */
  armed?: boolean
}

/**
 * Caméra de SUIVI LIBRE pendant le vol : la caméra n'est PLUS repositionnée de
 * force (l'utilisateur garde le plein contrôle — orbite 360°, zoom). À chaque
 * frame, la caméra ET la cible sont simplement TRANSLATÉES du même vecteur que
 * la fusée (déplacement relatif rigide) : la fusée reste centrée et la
 * distance/l'angle choisis par l'utilisateur sont préservés. À la fin du vol,
 * après une courte pause sur l'impact, tout revient en douceur au pas de tir.
 */
export function useOrbitTargetFollow({ controlsRef, rocketRef, flying, armed = false }: UseOrbitTargetFollowParams) {
  const { camera } = useThree()
  const shift = useRef(new THREE.Vector3())
  const home = useRef(new THREE.Vector3(...CAMERA_TARGET))
  const wasFlying = useRef(false)
  const returning = useRef(false)
  const returnWait = useRef(0)
  // Position de la fusée à la frame PRÉCÉDENTE : le déplacement (delta) entre
  // deux frames est appliqué tel quel à la caméra et à la cible.
  const prevRocket = useRef(new THREE.Vector3())
  // Position caméra au moment où le vol démarre : point de retour en fin de vol.
  const baseCamPos = useRef(new THREE.Vector3())
  const hasFlownOnce = useRef(false)

  // Scénario réarmé (replay) : SNAP immédiat, sans attendre l'amortissement du
  // retour normal (RETURN_STIFFNESS) — sinon la caméra peut rester loin du pad
  // si le clic REPLAY intervient avant la fin du retour doux, et la fusée
  // statique (bien réaffichée) devient indiscernable à cette distance/zoom.
  useEffect(() => {
    if (!armed) return
    const controls = controlsRef.current
    if (!controls) return
    controls.target.copy(home.current)
    if (hasFlownOnce.current) camera.position.copy(baseCamPos.current)
    controls.update()
    returning.current = false
    wasFlying.current = false
  }, [armed, camera, controlsRef])

  useFrame(({ camera }, delta) => {
    const controls = controlsRef.current
    if (!controls) return
    const dt = Math.min(delta, 0.05) // borne anti-saut après un lag

    if (flying && rocketRef.current) {
      const rocket = rocketRef.current
      if (!wasFlying.current) {
        baseCamPos.current.copy(camera.position)
        hasFlownOnce.current = true
        // Au décollage, la cible passe sur la fusée SANS bouger la caméra :
        // l'utilisateur garde son cadrage de départ, la fusée devient le
        // centre d'orbite.
        prevRocket.current.copy(rocket)
        controls.target.copy(rocket)
      }
      wasFlying.current = true
      returning.current = false

      // Déplacement de la fusée depuis la frame précédente : appliqué TEL QUEL
      // à la caméra ET à la cible (translation rigide). Résultat : la fusée
      // reste centrée, la distance/l'angle choisis par l'utilisateur sont
      // conservés — il peut orbiter à 360° et zoomer librement pendant le vol.
      shift.current.copy(rocket).sub(prevRocket.current)
      prevRocket.current.copy(rocket)
      camera.position.add(shift.current)
      controls.target.add(shift.current)
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
    camera.position.lerp(baseCamPos.current, t)

    if (controls.target.distanceToSquared(home.current) < RETURN_DONE_SQ) {
      returning.current = false
    }
  })
}
