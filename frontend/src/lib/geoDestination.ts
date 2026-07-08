const KM_PER_DEG_LAT = 111.32

/**
 * Point situé à `distanceKm` du départ, selon le cap `bearingDeg` (0 = Nord,
 * sens horaire). Approximation équirectangulaire — largement suffisante aux
 * échelles de la carte de mission (quelques dizaines de km). Sert à tracer le
 * faisceau d'azimut du pas de tir vers la zone d'impact estimée.
 */
export function destinationPoint(
  lng: number,
  lat: number,
  bearingDeg: number,
  distanceKm: number,
): [number, number] {
  const bearing = (bearingDeg * Math.PI) / 180
  const northKm = distanceKm * Math.cos(bearing)
  const eastKm = distanceKm * Math.sin(bearing)
  const dLat = northKm / KM_PER_DEG_LAT
  const dLng = eastKm / (KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180))
  return [lng + dLng, lat + dLat]
}
