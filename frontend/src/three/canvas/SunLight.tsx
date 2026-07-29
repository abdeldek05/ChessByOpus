import { useMemo } from 'react'
import * as THREE from 'three'
import { getSunDirection, LIGHTING } from '@/three/constants/launchDaylight'
import { getMoonDirection, NIGHT_LIGHTING } from '@/three/constants/launchNight'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { PHOTO_MODE, PHOTO_SHADOW_MAP_SIZE } from '@/three/constants/photoMode'
import type { SceneMode } from '@/types/scene.types'

/** Résolution de la shadow map : 2048 en usage normal, poussée en mode photo
 *  (ombres figées → le coût n'est payé qu'au re-cuit, voir FreezeShadows). */
const SHADOW_MAP_SIZE = PHOTO_MODE ? PHOTO_SHADOW_MAP_SIZE : 2048

interface SunLightProps {
  /** Demi-étendue (unités) de la shadow-camera : couvre le pas de tir + décor. */
  shadowRadius?: number
  /** Ambiance : jour (soleil golden hour chaud) ou nuit (lune froide faible). */
  mode?: SceneMode
}

/**
 * Éclairage directionnel + hémisphérique de la scène, selon l'ambiance :
 *
 * - JOUR (golden hour) : soleil chaud et rasant (ombres longues) + rim froid en
 *   contre-jour. Direction dérivée de getSunDirection (alignée sur l'HDRI).
 * - NUIT : « lune » froide et faible, plus haute (clair de lune vertical doux),
 *   hémisphérique bleu nuit — voir launchNight. Bien plus sombre.
 *
 * La shadow-camera (recentrée sur le pad, dimensionnée par shadowRadius) est
 * identique dans les deux modes. `mode` prend enfin effet ici (bouton ☀/☾).
 */
export function SunLight({ shadowRadius = 60, mode = 'day' }: SunLightProps) {
  const target = useMemo(() => {
    const object = new THREE.Object3D()
    object.position.set(LAUNCH_CENTER[0], 0, LAUNCH_CENTER[2])
    return object
  }, [])

  const night = mode === 'night'
  // Direction de la source (soleil le jour, lune la nuit) + jeu de lumière.
  const direction = useMemo(() => (night ? getMoonDirection() : getSunDirection()), [night])
  const keyColor = night ? NIGHT_LIGHTING.moonColor : LIGHTING.sunColor
  const keyIntensity = night ? NIGHT_LIGHTING.moonIntensity : LIGHTING.sunIntensity
  const skyTint = night ? NIGHT_LIGHTING.skyTint : LIGHTING.skyTint
  const groundTint = night ? NIGHT_LIGHTING.groundTint : LIGHTING.groundTint
  const hemiIntensity = night ? NIGHT_LIGHTING.hemiIntensity : LIGHTING.hemiIntensity
  const rimColor = night ? NIGHT_LIGHTING.rimColor : LIGHTING.rimColor
  const rimIntensity = night ? NIGHT_LIGHTING.rimIntensity : LIGHTING.rimIntensity

  // Distance de la source : grande devant shadowRadius → rayons quasi parallèles.
  const lightPosition = useMemo((): [number, number, number] => {
    const [dx, dy, dz] = direction
    const distance = shadowRadius * 6
    return [LAUNCH_CENTER[0] + dx * distance, dy * distance, LAUNCH_CENTER[2] + dz * distance]
  }, [shadowRadius, direction])

  // Rim light : direction OPPOSÉE à la source (contre-jour), hauteur modérée.
  const rimPosition = useMemo((): [number, number, number] => {
    const [dx, dy, dz] = direction
    const distance = shadowRadius * 4
    return [LAUNCH_CENTER[0] - dx * distance, Math.max(dy, 0.3) * distance * 0.5, LAUNCH_CENTER[2] - dz * distance]
  }, [shadowRadius, direction])

  return (
    <>
      <hemisphereLight args={[skyTint, groundTint, hemiIntensity]} />
      <primitive object={target} />
      <directionalLight
        position={lightPosition}
        target={target}
        color={keyColor}
        intensity={keyIntensity}
        castShadow
        // 2048² : les ombres sont FIGÉES (shadowMap.autoUpdate = false dans
        // LaunchSceneCanvas, re-cuites quelques frames par FreezeShadows), donc
        // la résolution ne se paie qu'au re-cuit — pas à chaque frame comme
        // avec des ombres dynamiques. À 1024² sur la zone rapprochée du pad, le
        // texel était grossier et les contours crénelés en permanence à l'écran ;
        // 2048² les affine pour un coût ponctuel négligeable. Le vrai risque
        // driver vient du pic de TRIANGLES (herbe/rochers/arbres), pas d'ici.
        shadow-mapSize-width={SHADOW_MAP_SIZE}
        shadow-mapSize-height={SHADOW_MAP_SIZE}
        shadow-camera-left={-shadowRadius}
        shadow-camera-right={shadowRadius}
        shadow-camera-top={shadowRadius}
        shadow-camera-bottom={-shadowRadius}
        shadow-camera-near={1}
        shadow-camera-far={shadowRadius * 8}
        shadow-bias={-0.0003}
        shadow-normalBias={0.045}
      />
      <directionalLight position={rimPosition} target={target} color={rimColor} intensity={rimIntensity} />
    </>
  )
}
