import { destinationPoint } from '@/lib/geoDestination'

// Ouverture du cône de visée (± degrés autour de l'azimut) : juste assez fin
// pour lire un cap précis, assez large pour rester visible à l'écran.
export const SIGHT_CONE_SPREAD_DEG = 4

/**
 * Cône de visée fin depuis un point, dans une direction donnée, sur une longueur
 * fixe. Outil de repérage interactif (« si je vise cet azimut, est-ce que ça
 * pointe vers mon radar ? ») — ce n'est pas une trajectoire réelle.
 */
export function buildSightCone(
  lng: number,
  lat: number,
  azimuthDeg: number,
  lengthKm: number,
  spreadDeg: number = SIGHT_CONE_SPREAD_DEG,
  segments: number = 16,
): [number, number][] {
  const arc: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const bearing = azimuthDeg - spreadDeg + (2 * spreadDeg * i) / segments
    arc.push(destinationPoint(lng, lat, bearing, lengthKm))
  }
  return [[lng, lat], ...arc, [lng, lat]]
}
