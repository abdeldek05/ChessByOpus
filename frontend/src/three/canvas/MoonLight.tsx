import { useMemo } from 'react'
import * as THREE from 'three'
import { MOON_LIGHT, MOON_LIGHT_POSITION } from '@/three/constants/launchNight'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'

interface MoonLightProps {
  /** Demi-étendue (unités) de la shadow-camera : couvre le pas de tir + décor. */
  shadowRadius?: number
}

/**
 * Éclairage de NUIT : clair de lune directionnel froid (ombres longues douces)
 * + hémisphérique très sombre pour garder la scène lisible sans casser
 * l'ambiance nocturne. Pendant de SunLight — même shadow-camera recentrée sur
 * le pas de tir, la bascule jour/nuit choisit l'une des deux lumières.
 */
export function MoonLight({ shadowRadius = 60 }: MoonLightProps) {
  const target = useMemo(() => {
    const object = new THREE.Object3D()
    object.position.set(LAUNCH_CENTER[0], 0, LAUNCH_CENTER[2])
    return object
  }, [])

  const lightPosition: [number, number, number] = [
    LAUNCH_CENTER[0] + MOON_LIGHT_POSITION[0],
    MOON_LIGHT_POSITION[1],
    LAUNCH_CENTER[2] + MOON_LIGHT_POSITION[2],
  ]

  return (
    <>
      <hemisphereLight args={[MOON_LIGHT.skyTint, MOON_LIGHT.groundTint, MOON_LIGHT.hemiIntensity]} />
      <primitive object={target} />
      <directionalLight
        position={lightPosition}
        target={target}
        color={MOON_LIGHT.color}
        intensity={MOON_LIGHT.intensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-shadowRadius}
        shadow-camera-right={shadowRadius}
        shadow-camera-top={shadowRadius}
        shadow-camera-bottom={-shadowRadius}
        shadow-camera-near={1}
        shadow-camera-far={shadowRadius * 4}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  )
}
