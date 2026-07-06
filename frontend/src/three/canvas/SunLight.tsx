import { useMemo } from 'react'
import * as THREE from 'three'
import { SUN_LIGHT_POSITION, LIGHTING } from '@/three/constants/launchDaylight'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'

/**
 * Éclairage de nuit : lune directionnelle froide (ombres douces sur la dalle,
 * la pelouse et les brins) + hémisphérique ciel nuit / sol sombre pour un
 * remplissage discret, aligné sur la lune du dôme de ciel.
 *
 * La lumière et sa shadow-camera sont recentrées au-dessus du banc de tir
 * (LAUNCH_CENTER) sinon la base sortirait du volume d'ombre.
 */
export function SunLight() {
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
        color={LIGHTING.moonColor}
        intensity={LIGHTING.moonIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={4}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </>
  )
}
