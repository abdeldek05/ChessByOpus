import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleBallistic, computeBallisticProfile } from '@/lib/ballistics'
import { TIME_SCALE } from '@/three/constants/trajectory'

interface UseMesangeFlightParams {
  /** Groupe de la Mesange (posée au repos, puis pilotée en vol). */
  groupRef: RefObject<THREE.Group | null>
  /** Début de vol (performance.now) ; null au sol. */
  startRef: RefObject<number | null>
  azimuthDeg: number
  inclinationDeg: number
  /** Position live de l'engin (monde) écrite chaque frame pour la caméra. */
  worldPosRef: RefObject<THREE.Vector3>
  /**
   * Groupe de la flamme moteur, FRÈRE de `groupRef` (pas un enfant : sinon
   * Box3.setFromObject dans useRestOnSurface l'inclurait, même invisible, et
   * fausserait le calage au sol). Synchronisé ici en position/rotation.
   */
  flameRef?: RefObject<THREE.Group | null>
}

const UP = new THREE.Vector3(0, 1, 0)
const dir = new THREE.Vector3()
const quaternion = new THREE.Quaternion()

/**
 * Fait voler la VRAIE Mesange (modèle GLB) le long de sa trajectoire balistique
 * réelle (gravité). Au sol (startRef null) la fusée reste posée sur le mât ; au
 * tir elle décolle depuis sa position de repos, s'oriente sur sa vitesse, puis
 * disparaît une fois retombée. Sa position monde est publiée dans `worldPosRef`
 * pour que la caméra puisse la suivre. La flamme moteur (si fournie) ne
 * s'allume que pendant la montée (vitesse verticale positive) : coupée en
 * phase balistique/retombée, comme un vrai moteur qui s'éteint après combustion.
 */
export function useMesangeFlight({
  groupRef,
  startRef,
  azimuthDeg,
  inclinationDeg,
  worldPosRef,
  flameRef,
}: UseMesangeFlightParams): void {
  const rest = useRef<THREE.Vector3 | null>(null)
  const profile = useMemo(
    () => computeBallisticProfile({ azimuthDeg, inclinationDeg }),
    [azimuthDeg, inclinationDeg],
  )

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    // Capture de la position de repos (après calage useRestOnSurface).
    if (rest.current === null) rest.current = group.position.clone()
    const restPos = rest.current
    const start = startRef.current

    if (start === null) {
      // Au sol : posée, droite, moteur éteint.
      group.position.copy(restPos)
      group.quaternion.identity()
      group.visible = true
      if (flameRef?.current) flameRef.current.visible = false
      group.getWorldPosition(worldPosRef.current)
      return
    }

    const localT = ((performance.now() - start) / 1000) * TIME_SCALE
    if (localT > profile.flightTimeSec) {
      group.visible = false
      if (flameRef?.current) flameRef.current.visible = false
      return
    }

    const s = sampleBallistic(localT, { azimuthDeg, inclinationDeg })
    group.visible = true
    group.position.set(restPos.x + s.x, restPos.y + s.y, restPos.z + s.z)
    dir.set(s.dirX, s.dirY, s.dirZ)
    quaternion.setFromUnitVectors(UP, dir)
    group.quaternion.copy(quaternion)
    group.getWorldPosition(worldPosRef.current)

    if (flameRef?.current) {
      flameRef.current.position.copy(group.position)
      flameRef.current.quaternion.copy(group.quaternion)
      flameRef.current.visible = s.dirY > 0
    }
  })
}
