import * as THREE from 'three'
import { RAIL_PIVOT_TOP } from '@/three/models/RailBase'
import { RAIL } from '@/three/constants/launchRail'
import { ROCKET_FALLBACK_HALF_HEIGHT } from '@/three/constants/launcherRig'

// Mêmes constantes que LaunchRail.tsx (position de la Mesange le long du fût) —
// dupliquées ici plutôt qu'importées pour rester une fonction pure sans
// dépendance au composant React (évite un cycle d'import).
const ROCKET_FRONT_OFFSET = -(RAIL.boomWidth / 2 + 0.35)
const ROCKET_ALONG_BOOM = ROCKET_FALLBACK_HALF_HEIGHT + 0.6

export interface RailRocketOrigin {
  /** Position locale (repère du groupe pad, cf. LaunchSceneCanvas) du bout de la fusée sur la rampe. */
  position: THREE.Vector3
  /** Direction unitaire pointée par le nez (axe du fût), à cette inclinaison/azimut. */
  direction: THREE.Vector3
}

/**
 * Position ET orientation EXACTES du bout de la fusée sur la rampe inclinée,
 * pour une inclinaison/azimut donnés — reproduit fidèlement la même hiérarchie
 * de transformations que `LaunchRail.tsx` (groupe azimut → groupe pivot+tilt →
 * groupe position le long du fût), afin que le vol démarre PILE là où la fusée
 * statique se trouvait juste avant, sans saut de position ni d'orientation
 * (le « pop » visuel au décollage venait d'une origine de vol fixe,
 * indépendante de l'inclinaison/azimut réels du scénario).
 */
export function computeRailRocketOrigin(inclinationDeg: number, azimuthDeg: number): RailRocketOrigin {
  const tiltRad = THREE.MathUtils.degToRad(90 - inclinationDeg)
  const azimuthRad = THREE.MathUtils.degToRad(azimuthDeg)
  const c = Math.cos(tiltRad)
  const s = Math.sin(tiltRad)
  const ca = Math.cos(azimuthRad)
  const sa = Math.sin(azimuthRad)

  // Rotation X (tilt, -tiltRad) du point (0, ROCKET_ALONG_BOOM, ROCKET_FRONT_OFFSET).
  const y1 = ROCKET_ALONG_BOOM * c + ROCKET_FRONT_OFFSET * s
  const z1 = ROCKET_FRONT_OFFSET * c - ROCKET_ALONG_BOOM * s

  // Rotation Y (azimut, -azimuthRad), MÊME convention que LaunchRail.tsx
  // (rotation={[0, -azimuthRad, 0]}) : pour un vecteur (x,z), la rotation
  // Three.js d'angle θ=-azimuthRad donne x' = x·ca - z·sa, z' = x·sa + z·ca.
  // Appliqué à (0, z1) : x' = -z1·sa, z' = z1·ca.
  const position = new THREE.Vector3(-z1 * sa, RAIL_PIVOT_TOP + y1, z1 * ca)

  // Direction du nez : image de (0,1,0) par Rx(-tiltRad) = (0, c, -s), puis
  // par la même rotation Y ci-dessus : x' = -(-s)·sa = s·sa, z' = -s·ca.
  // (Signe X corrigé : la version précédente donnait -s*sa, opposé à la vraie
  // direction de la rampe — c'était LA cause du bug « la fusée part dans une
  // autre direction que celle affichée/choisie ».)
  const direction = new THREE.Vector3(s * sa, c, -s * ca)

  return { position, direction }
}
