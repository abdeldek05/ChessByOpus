import { useMemo } from 'react'
import * as THREE from 'three'
import { getSunDirection, LIGHTING } from '@/three/constants/launchDaylight'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'

interface SunLightProps {
  /** Demi-étendue (unités) de la shadow-camera : couvre le pas de tir + décor. */
  shadowRadius?: number
}

/**
 * Éclairage de jour (golden hour) : soleil directionnel chaud et rasant (ombres
 * longues sur la pelouse et la base) + hémisphérique ciel/sol pour un
 * remplissage doux + un rim/fill light froid en CONTRE du soleil (simule le
 * bounce light que Three.js ne calcule pas nativement — évite les faces
 * d'ombre plates et totalement noires sur le béton du pad). Position du
 * soleil dérivée de `getSunDirection()` (même source que le ciel physique
 * `<Sky>`) — soleil visuel et ombres portées restent TOUJOURS alignés. La
 * shadow-camera est recentrée sur le pas de tir et dimensionnée par
 * `shadowRadius` pour englober le décor proche.
 */
export function SunLight({ shadowRadius = 60 }: SunLightProps) {
  const target = useMemo(() => {
    const object = new THREE.Object3D()
    object.position.set(LAUNCH_CENTER[0], 0, LAUNCH_CENTER[2])
    return object
  }, [])

  // Distance du soleil : suffisamment grande devant shadowRadius pour des
  // rayons quasi parallèles (pas de perspective visible sur les ombres).
  const sunDirection = useMemo(() => getSunDirection(), [])
  const lightPosition = useMemo((): [number, number, number] => {
    const [dx, dy, dz] = sunDirection
    const distance = shadowRadius * 6
    return [LAUNCH_CENTER[0] + dx * distance, dy * distance, LAUNCH_CENTER[2] + dz * distance]
  }, [shadowRadius, sunDirection])

  // Rim light : même distance, direction OPPOSÉE au soleil (contre-jour),
  // hauteur modérée — éclaire juste assez les faces à l'ombre pour qu'elles
  // ne tombent pas à un noir total, sans ombre propre (coût quasi nul).
  const rimPosition = useMemo((): [number, number, number] => {
    const [dx, dy, dz] = sunDirection
    const distance = shadowRadius * 4
    return [LAUNCH_CENTER[0] - dx * distance, Math.max(dy, 0.3) * distance * 0.5, LAUNCH_CENTER[2] - dz * distance]
  }, [shadowRadius, sunDirection])

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
        // RELEVÉ (avant 2048) : texel plus fin (2·200/4096 ≈ 0.1u), contour
        // d'ombre plus net. FPS relâché pendant cette passe de rendu.
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-shadowRadius}
        shadow-camera-right={shadowRadius}
        shadow-camera-top={shadowRadius}
        shadow-camera-bottom={-shadowRadius}
        shadow-camera-near={1}
        shadow-camera-far={shadowRadius * 8}
        shadow-bias={-0.0003}
        shadow-normalBias={0.045}
      />
      <directionalLight
        position={rimPosition}
        target={target}
        color={LIGHTING.rimColor}
        intensity={LIGHTING.rimIntensity}
      />
    </>
  )
}
