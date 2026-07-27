import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleSceneGround } from '@/lib/sampleSceneGround'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import {
  RADAR_VIEW_HEIGHT,
  RADAR_VIEW_PULLBACK_FACTOR,
  RADAR_VIEW_LOOK_STIFFNESS,
} from '@/three/constants/cameraModes'

interface UseRadarViewCameraParams {
  /** Ce mode est-il actif ? Inactif : ne touche jamais la caméra. */
  enabled: boolean
  /** Position scène du 1er radar (x,z) — d'où l'on regarde. */
  radarScene: { x: number; z: number } | null
  /** Position monde live de la fusée (King) — cible du regard ; null hors vol. */
  rocketRef: React.RefObject<THREE.Vector3 | null>
}

/**
 * Vue CÔTÉ RADAR : la caméra est POSÉE près du radar (un peu au-dessus de son
 * antenne, légèrement en retrait vers l'extérieur pour cadrer radar + pas de
 * tir) et REGARDE la fusée monter — le point de vue du défenseur. Position
 * fixe, seul le regard (lookAt) suit la fusée, lissé pour ne pas saccader. Tant
 * qu'aucun vol n'a lieu, elle vise le pas de tir. OrbitControls est désactivé
 * par l'appelant dans ce mode (caméra pilotée, pas orbitée).
 */
export function useRadarViewCamera({ enabled, radarScene, rocketRef }: UseRadarViewCameraParams) {
  const camera = useThree((state) => state.camera)
  const lookTarget = useRef(new THREE.Vector3(...LAUNCH_CENTER))

  // Position fixe de la caméra : au-dessus du radar, tirée un peu vers
  // l'extérieur (à l'opposé du pad) pour garder le radar dans le champ.
  const camPosition = useMemo(() => {
    if (!radarScene) return null
    const groundY = sampleSceneGround(radarScene.x, radarScene.z)
    const outward = new THREE.Vector3(radarScene.x - LAUNCH_CENTER[0], 0, radarScene.z - LAUNCH_CENTER[2])
    const dist = outward.length() || 1
    outward.normalize()
    return new THREE.Vector3(
      radarScene.x + outward.x * dist * RADAR_VIEW_PULLBACK_FACTOR,
      groundY + RADAR_VIEW_HEIGHT,
      radarScene.z + outward.z * dist * RADAR_VIEW_PULLBACK_FACTOR,
    )
  }, [radarScene])

  // À l'activation : place la caméra une fois et vise le pad par défaut.
  useEffect(() => {
    if (!enabled || !camPosition) return
    camera.position.copy(camPosition)
    lookTarget.current.set(...LAUNCH_CENTER)
    camera.lookAt(lookTarget.current)
  }, [enabled, camPosition, camera])

  useFrame((_, delta) => {
    if (!enabled || !camPosition) return
    const dt = Math.min(delta, 0.05)
    // Cible du regard : la fusée si elle vole, sinon le pas de tir.
    const desired = rocketRef.current ?? new THREE.Vector3(...LAUNCH_CENTER)
    lookTarget.current.lerp(desired, 1 - Math.exp(-RADAR_VIEW_LOOK_STIFFNESS * dt))
    camera.position.copy(camPosition) // reste fixe même si un autre effet a bougé
    camera.lookAt(lookTarget.current)
  })
}
