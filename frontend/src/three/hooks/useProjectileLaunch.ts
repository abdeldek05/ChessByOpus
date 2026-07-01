import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MAX_FRAME_DELTA } from '@/three/constants/frameTiming'
import { LAUNCH_REST_SECONDS } from '@/three/constants/launchPhysics'

interface ProjectileParams {
  speed: number
  gravity: number
  inclinationDeg: number
  azimuthDeg: number
  baseHeight: number
}

/**
 * Anime un pivot selon un tir balistique (vitesse initiale + gravité
 * constante), réoriente la fusée le long de son vecteur vitesse, puis rejoue
 * la boucle après une courte pause au sol. Mouvement parabolique réel — pas
 * une courbe scriptée — mais valeurs de scène, pas SI (placeholder).
 */
export function useProjectileLaunch(pivotRef: RefObject<THREE.Group | null>, params: ProjectileParams) {
  const elapsed = useRef(0)
  const resting = useRef(false)
  const restElapsed = useRef(0)
  const up = useRef(new THREE.Vector3(0, 1, 0))
  const direction = useRef(new THREE.Vector3())
  const orientation = useRef(new THREE.Quaternion())

  useFrame((_, delta) => {
    const pivot = pivotRef.current
    if (!pivot) return

    const dt = Math.min(delta, MAX_FRAME_DELTA)
    const { speed, gravity, inclinationDeg, azimuthDeg, baseHeight } = params
    const inclination = THREE.MathUtils.degToRad(inclinationDeg)
    const azimuth = THREE.MathUtils.degToRad(azimuthDeg)
    const verticalSpeed = speed * Math.sin(inclination)
    const horizontalSpeed = speed * Math.cos(inclination)

    if (resting.current) {
      restElapsed.current += dt
      if (restElapsed.current >= LAUNCH_REST_SECONDS) {
        resting.current = false
        restElapsed.current = 0
        elapsed.current = 0
      }
      return
    }

    elapsed.current += dt
    const t = elapsed.current
    const height = verticalSpeed * t - 0.5 * gravity * t * t

    if (height <= 0 && t > 0.05) {
      resting.current = true
      pivot.position.set(0, baseHeight, 0)
      pivot.quaternion.identity()
      return
    }

    const horizontalDistance = horizontalSpeed * t
    pivot.position.set(
      horizontalDistance * Math.sin(azimuth),
      baseHeight + height,
      -horizontalDistance * Math.cos(azimuth),
    )

    const verticalVelocity = verticalSpeed - gravity * t
    direction.current
      .set(horizontalSpeed * Math.sin(azimuth), verticalVelocity, -horizontalSpeed * Math.cos(azimuth))
      .normalize()
    orientation.current.setFromUnitVectors(up.current, direction.current)
    pivot.quaternion.copy(orientation.current)
  })
}
