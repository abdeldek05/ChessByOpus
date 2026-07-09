import { useMemo } from 'react'
import * as THREE from 'three'
import { METERS_PER_SCENE_UNIT } from '@/lib/computeRadarSceneOffset'
import { RING_STEPS_KM } from '@/three/constants/distanceRings'

export interface DistanceRing {
  km: number
  /** Rayon de l'anneau en unités de scène (échelle fixe 1:200). */
  radius: number
  /** Géométrie de la ligne circulaire (dans le plan XZ, à poser à plat). */
  geometry: THREE.BufferGeometry
}

/** Segments du cercle : assez pour un tracé lisse même sur les grands rayons. */
const SEGMENTS = 128

/**
 * Anneaux de distance à afficher : un par palier km tenant dans le rayon
 * maximal visible. Chaque anneau porte sa géométrie circulaire mémoïsée (plan
 * XZ, à faire pivoter à plat au rendu). Aucun rendu ici — que du calcul.
 */
export function useDistanceRings(maxRadius: number): DistanceRing[] {
  return useMemo(() => {
    return RING_STEPS_KM.map((km) => {
      const radius = (km * 1000) / METERS_PER_SCENE_UNIT
      return { km, radius }
    })
      .filter((ring) => ring.radius <= maxRadius)
      .map(({ km, radius }) => {
        const points: THREE.Vector3[] = []
        for (let i = 0; i <= SEGMENTS; i++) {
          const angle = (i / SEGMENTS) * Math.PI * 2
          points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
        }
        return { km, radius, geometry: new THREE.BufferGeometry().setFromPoints(points) }
      })
  }, [maxRadius])
}
