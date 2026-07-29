import type * as THREE from 'three'

/** Précision de la clé (mm à l'échelle scène) : deux vecteurs plus proches que
 *  ça décrivent la même position et ne doivent pas relancer un playback. */
const DECIMALS = 3

/** Sérialise un Vector3 en clé de valeur stable, pour dépendre de ses
 *  COMPOSANTES dans un `useMemo`/`useEffect` plutôt que de l'identité de l'objet.
 *
 *  Utile quand un parent reconstruit un `new THREE.Vector3(...)` à chaque render :
 *  la référence change alors à chaque fois, ce qui invaliderait le mémo (et
 *  réinitialiserait l'animation qui en dépend) même à coordonnées identiques.
 */
export function vectorKey(v: THREE.Vector3): string {
  return `${v.x.toFixed(DECIMALS)},${v.y.toFixed(DECIMALS)},${v.z.toFixed(DECIMALS)}`
}
