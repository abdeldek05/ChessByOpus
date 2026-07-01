import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGradientSkyTexture } from '@/three/hooks/useGradientSkyTexture'
import { LAUNCH_FOG_NEAR, LAUNCH_FOG_FAR } from '@/three/constants/launchScene'
import type { LaunchAmbiance } from '@/three/constants/launchAmbiance'

interface LaunchEnvironmentProps {
  ambiance: LaunchAmbiance
  fogNear?: number
  fogFar?: number
}

/**
 * Pose le fond de ciel dégradé et la brume d'horizon selon l'ambiance
 * (jour/nuit), puis les restaure au démontage (scène R3F partagée). Ne rend
 * rien lui-même.
 */
export function LaunchEnvironment({ ambiance, fogNear = LAUNCH_FOG_NEAR, fogFar = LAUNCH_FOG_FAR }: LaunchEnvironmentProps) {
  const scene = useThree((state) => state.scene)
  const skyTexture = useGradientSkyTexture(ambiance.skyTop, ambiance.skyHorizon)

  useLayoutEffect(() => {
    const previousBackground = scene.background
    const previousFog = scene.fog
    scene.background = skyTexture
    scene.fog = new THREE.Fog(ambiance.fog, fogNear, fogFar)
    return () => {
      scene.background = previousBackground
      scene.fog = previousFog
    }
  }, [scene, skyTexture, ambiance.fog, fogNear, fogFar])

  return null
}
