import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleSceneGround } from '@/lib/sampleSceneGround'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import {
  WIDE_VIEW_DISTANCE_FACTOR,
  WIDE_VIEW_HEIGHT_FACTOR,
  WIDE_VIEW_LOOK_HEIGHT_FACTOR,
} from '@/three/constants/cameraModes'

interface UseWideCameraParams {
  /** Ce mode est-il actif ? Inactif : ne touche jamais la caméra. */
  enabled: boolean
  /** Rayon scène à cadrer (radar le plus loin OU portée du vol) — dimensionne
   *  le recul de la caméra pour que tout le théâtre tienne dans le champ. */
  frameRadius: number
}

/**
 * VUE LARGE FIXE : caméra immobile en recul et en hauteur, cadrant TOUT le
 * théâtre d'opérations (pas de tir + trajectoires + radars) en PERMANENCE —
 * contrairement à l'ancien comportement où cette vue d'ensemble n'apparaissait
 * qu'au replay. Ne suit rien : les fusées entrent et sortent du cadre large.
 * OrbitControls est désactivé par l'appelant dans ce mode.
 */
export function useWideCamera({ enabled, frameRadius }: UseWideCameraParams) {
  const camera = useThree((state) => state.camera)

  const { position, lookAt } = useMemo(() => {
    const r = Math.max(200, frameRadius)
    // Reculée sur -Z (devant la scène, côté sud) et haute : cadre pad + ciel.
    const groundY = sampleSceneGround(LAUNCH_CENTER[0], LAUNCH_CENTER[2] + r)
    const position = new THREE.Vector3(
      LAUNCH_CENTER[0],
      groundY + r * WIDE_VIEW_HEIGHT_FACTOR,
      LAUNCH_CENTER[2] + r * WIDE_VIEW_DISTANCE_FACTOR,
    )
    const lookAt = new THREE.Vector3(LAUNCH_CENTER[0], r * WIDE_VIEW_LOOK_HEIGHT_FACTOR, LAUNCH_CENTER[2])
    return { position, lookAt }
  }, [frameRadius])

  useEffect(() => {
    if (!enabled) return
    camera.position.copy(position)
    camera.lookAt(lookAt)
  }, [enabled, position, lookAt, camera])

  useFrame(() => {
    if (!enabled) return
    // Fixe : on réaffirme la pose chaque frame (au cas où un autre effet
    // l'aurait touchée avant que ce mode reprenne la main).
    camera.position.copy(position)
    camera.lookAt(lookAt)
  })
}
