/**
 * Cap (azimut, 0 = Nord, sens horaire) du point `from` vers le point `to`.
 * Approximation équirectangulaire, cohérente avec geoDestination.ts aux échelles
 * de la carte de mission.
 */
export function bearingBetween(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const eastKm = (to.longitude - from.longitude) * Math.cos((from.latitude * Math.PI) / 180)
  const northKm = to.latitude - from.latitude
  const deg = (Math.atan2(eastKm, northKm) * 180) / Math.PI
  return (deg + 360) % 360
}
