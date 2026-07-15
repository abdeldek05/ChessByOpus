const EARTH_RADIUS_M = 6371000

/**
 * Convertit un décalage ENU (est/nord, en mètres) autour d'une origine
 * géographique en coordonnées [longitude, latitude]. Inverse exact de la
 * projection utilisée par `computeRadarSceneOffset` (est = +X, nord = +Y).
 * Sert à tracer sur une carte 2D (MapLibre) la trajectoire RocketPy, dont les
 * points sont en ENU mètres. Fonction pure.
 *
 * @param eastM   décalage vers l'est (m)
 * @param northM  décalage vers le nord (m)
 * @param originLng longitude de l'origine (pas de tir)
 * @param originLat latitude de l'origine (pas de tir)
 * @returns [longitude, latitude]
 */
export function enuToLatLon(
  eastM: number,
  northM: number,
  originLng: number,
  originLat: number,
): [number, number] {
  const latRad = (originLat * Math.PI) / 180
  const dLat = (northM / EARTH_RADIUS_M) * (180 / Math.PI)
  const dLng = (eastM / (EARTH_RADIUS_M * Math.cos(latRad))) * (180 / Math.PI)
  return [originLng + dLng, originLat + dLat]
}
