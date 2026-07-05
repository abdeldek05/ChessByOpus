import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Plan de drapeau légèrement ondulé (déformation sinusoïdale figée, amplifiée
 * vers le bord libre) : évite l'aspect « panneau rigide » sans coût par frame.
 */
export function useWavedFlagGeometry(width: number, height: number, waveDepth: number): THREE.PlaneGeometry {
  return useMemo(() => {
    const geometry = new THREE.PlaneGeometry(width, height, 8, 3)
    const positions = geometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const distanceFromPole = (positions.getX(i) + width / 2) / width
      positions.setZ(i, Math.sin(distanceFromPole * Math.PI * 1.8) * waveDepth * distanceFromPole)
    }
    geometry.computeVertexNormals()
    return geometry
  }, [width, height, waveDepth])
}
