import { useMemo } from 'react'
import * as THREE from 'three'
import { SUN_LIGHT_POSITION, LIGHTING } from '@/three/constants/launchDaylight'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'

interface SunLightProps {
  /** Demi-étendue (unités) de la shadow-camera : couvre le pas de tir + décor. */
  shadowRadius?: number
}

/**
 * Éclairage de jour (golden hour) : soleil directionnel chaud et rasant (ombres
 * longues sur la pelouse et la base) + hémisphérique ciel/sol pour un
 * remplissage doux. La shadow-camera est recentrée sur le pas de tir et
 * dimensionnée par `shadowRadius` pour englober le décor proche.
 */
export function SunLight({ shadowRadius = 60 }: SunLightProps) {
  const target = useMemo(() => {
    const object = new THREE.Object3D()
    object.position.set(LAUNCH_CENTER[0], 0, LAUNCH_CENTER[2])
    return object
  }, [])

  const lightPosition: [number, number, number] = [
    LAUNCH_CENTER[0] + SUN_LIGHT_POSITION[0],
    SUN_LIGHT_POSITION[1],
    LAUNCH_CENTER[2] + SUN_LIGHT_POSITION[2],
  ]

  return (
    <>
      <hemisphereLight args={[LIGHTING.skyTint, LIGHTING.groundTint, LIGHTING.hemiIntensity]} />
      <primitive object={target} />
      <directionalLight
        position={lightPosition}
        target={target}
        color={LIGHTING.sunColor}
        intensity={LIGHTING.sunIntensity}
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
