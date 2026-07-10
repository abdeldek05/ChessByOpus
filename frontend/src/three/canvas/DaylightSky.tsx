import { useMemo } from 'react'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import { SKY } from '@/three/constants/launchDaylight'

/**
 * Ciel physique de jour (golden hour) via le composant <Sky> de drei (modèle
 * de Preetham) : dégradé atmosphérique réaliste + disque solaire bas sur
 * l'horizon. Statique (aucun useFrame), donc quasi gratuit. Remplace l'ancien
 * dôme de nuit custom.
 */
export function DaylightSky() {
  // Position du soleil déduite de l'élévation/azimut (sphère unité × distance).
  const sunPosition = useMemo(() => {
    const phi = THREE.MathUtils.degToRad(90 - SKY.elevationDeg)
    const theta = THREE.MathUtils.degToRad(SKY.azimuthDeg)
    return new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
  }, [])

  return (
    <Sky
      distance={SKY.distance}
      sunPosition={sunPosition}
      turbidity={SKY.turbidity}
      rayleigh={SKY.rayleigh}
      mieCoefficient={SKY.mieCoefficient}
      mieDirectionalG={SKY.mieDirectionalG}
    />
  )
}
