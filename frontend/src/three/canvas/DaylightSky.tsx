import { useMemo } from 'react'
import * as THREE from 'three'
import { SKY } from '@/three/constants/launchDaylight'

// Rapport constant rayon/distance du disque solaire : garde la même TAILLE
// ANGULAIRE (perçue) quelle que soit l'échelle de la scène — contrairement à
// une distance ET un rayon fixes (le soleil se serait retrouvé "devant" le
// terrain lointain à une échelle agrandie, ou aurait paru minuscule/proche
// selon le sens de l'erreur). ~5° de diamètre apparent, cohérent avec un vrai
// soleil bas sur l'horizon.
const SUN_DISC_ANGULAR_RATIO = 0.045

interface DaylightSkyProps {
  /** Distance du disque solaire ; doit rester > cameraFar. Le rayon suit en proportion (taille angulaire constante). */
  distance: number
}

/**
 * Soleil de jour (golden hour) : disque émissif simple, comme la lune de
 * NightSky — plus de ciel physique <Sky> (shader Preetham). Sa distance suit
 * l'échelle de la scène (cameraFar) pour ne jamais se retrouver devant le
 * terrain lointain ; son rayon suit la même proportion pour rester bien
 * visible quelle que soit l'échelle.
 */
export function DaylightSky({ distance }: DaylightSkyProps) {
  const position = useMemo(() => {
    const phi = THREE.MathUtils.degToRad(90 - SKY.elevationDeg)
    const theta = THREE.MathUtils.degToRad(SKY.azimuthDeg)
    return new THREE.Vector3().setFromSphericalCoords(distance, phi, theta)
  }, [distance])

  return (
    <mesh position={position}>
      <sphereGeometry args={[distance * SUN_DISC_ANGULAR_RATIO, 24, 24]} />
      {/* fog=false : le disque solaire est très loin (distance = cameraFar*1.3,
          au-delà du fog calé sur terrainRadius) — sans ça, le fog le noie en
          fonction du zoom (le fog "far" dépend de terrainRadius, potentiellement
          plus proche que le soleil), donnant un ciel qui semble s'éteindre. */}
      <meshBasicMaterial color="#ffd9a0" toneMapped={false} fog={false} />
    </mesh>
  )
}
