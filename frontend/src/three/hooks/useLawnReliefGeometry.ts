import { useMemo } from 'react'
import * as THREE from 'three'
import { sampleLawnRelief } from '@/lib/sampleLawnRelief'
import { RELIEF_SEGMENTS } from '@/three/constants/lawnRelief'

/**
 * Plan de sol subdivisé et déplacé par `sampleLawnRelief` : donne au terrain
 * de larges ondulations douces tout en gardant une zone plate sous le banc de
 * tir. Les normales sont recalculées pour que la lumière accroche le relief.
 */
export function useLawnReliefGeometry(size: number): THREE.PlaneGeometry {
  return useMemo(() => {
    const geometry = new THREE.PlaneGeometry(size, size, RELIEF_SEGMENTS, RELIEF_SEGMENTS)
    const positions = geometry.attributes.position

    // Le plan est créé dans le plan XY puis tourné de -90° autour de X à
    // l'affichage : ici X reste X, mais Y du plan devient Z monde. On déplace
    // donc l'axe Z local (la profondeur), qui deviendra la hauteur monde.
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      positions.setZ(i, sampleLawnRelief(x, -y))
    }

    geometry.computeVertexNormals()
    return geometry
  }, [size])
}
