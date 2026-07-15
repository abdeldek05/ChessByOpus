import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DAYLIGHT_EXPOSURE, DAYLIGHT_BACKGROUND } from '@/three/constants/launchDaylight'
import { NIGHT_EXPOSURE, NIGHT_BACKGROUND } from '@/three/constants/launchNight'
import { DESERT_EXPOSURE } from '@/three/constants/desertField'
import type { SceneMode, SceneBiome } from '@/types/scene.types'

interface SceneToneProps {
  mode: SceneMode
  /** Biome : le désert en journée baisse l'exposition (sable très réfléchissant). */
  biome?: SceneBiome
}

/**
 * Applique l'exposition (tone mapping) et la couleur de fond selon l'ambiance
 * jour/nuit ET le biome — de façon RÉACTIVE (la bascule fonctionne à tout
 * moment, pas seulement à la création du Canvas). Une seule responsabilité :
 * le ton global.
 */
export function SceneTone({ mode, biome = 'meadow' }: SceneToneProps) {
  const { gl, scene } = useThree()

  useEffect(() => {
    const night = mode === 'night'
    const dayExposure = biome === 'desert' ? DESERT_EXPOSURE : DAYLIGHT_EXPOSURE
    gl.toneMappingExposure = night ? NIGHT_EXPOSURE : dayExposure
    scene.background = new THREE.Color(night ? NIGHT_BACKGROUND : DAYLIGHT_BACKGROUND)
  }, [mode, biome, gl, scene])

  return null
}
