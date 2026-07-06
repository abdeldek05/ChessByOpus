import { useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ENGINE_FLAME } from '@/three/constants/engineFlame'

/**
 * Scintillement de la flamme moteur : légère variation de taille et
 * d'intensité (deux sinusoïdes déphasées) pour éviter l'aspect statique d'une
 * simple sphère émissive fixe.
 */
export function useEngineFlicker(
  meshRef: RefObject<THREE.Mesh | null>,
  lightRef: RefObject<THREE.PointLight | null>,
): void {
  const seed = useRef(Math.random() * 100)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * ENGINE_FLAME.flickerSpeed + seed.current
    const flicker = 1 + Math.sin(t) * ENGINE_FLAME.flickerAmount + Math.sin(t * 2.7) * ENGINE_FLAME.flickerAmount * 0.4
    if (meshRef.current) meshRef.current.scale.setScalar(flicker)
    if (lightRef.current) lightRef.current.intensity = ENGINE_FLAME.lightIntensity * flicker
  })
}
