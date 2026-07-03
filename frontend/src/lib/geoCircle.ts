const EARTH_RADIUS_KM = 6371
const SEGMENTS = 96

/**
 * Génère un cercle géodésique (rayon en km) autour d'un point, en coordonnées
 * [lng, lat], fermé — pour dessiner la portée d'un radar sur une carte.
 */
export function buildRangeCircle(
  centerLng: number,
  centerLat: number,
  radiusKm: number,
): [number, number][] {
  const latRad = (centerLat * Math.PI) / 180
  const dLat = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI)
  const dLng = dLat / Math.cos(latRad)

  const points: [number, number][] = []
  for (let i = 0; i <= SEGMENTS; i += 1) {
    const angle = (i / SEGMENTS) * 2 * Math.PI
    points.push([centerLng + dLng * Math.cos(angle), centerLat + dLat * Math.sin(angle)])
  }
  return points
}
