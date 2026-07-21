import { destinationPoint } from '@/lib/geoDestination'

/**
 * Secteur angulaire plein (polygone) centré sur (lng, lat), entre les caps
 * [headingDeg - halfWidthDeg, headingDeg + halfWidthDeg], sur un rayon
 * radiusKm — le « coup de balai » instantané du faisceau radar.
 */
export function buildRadarSector(
  lng: number,
  lat: number,
  headingDeg: number,
  halfWidthDeg: number,
  radiusKm: number,
  segments: number = 8,
): [number, number][] {
  const arc: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const bearing = headingDeg - halfWidthDeg + (2 * halfWidthDeg * i) / segments
    arc.push(destinationPoint(lng, lat, bearing, radiusKm))
  }
  return [[lng, lat], ...arc, [lng, lat]]
}

/**
 * Faisceau + traîne de rémanence : le secteur de TÊTE (largeur headingHalfWidthDeg,
 * pleine opacité `fade=1`) suivi d'une traîne fine et NOMBREUSE de secteurs à
 * opacité décroissante EXPONENTIELLE (chute rapide, pas linéaire) — lecture nette
 * du « coup de balai » et de son sens, comme la persistance d'un écran radar PPI.
 * `direction` = signe de rotation (+1 horaire, -1 anti-horaire, voir
 * SWEEP_DIRECTION) : la traîne s'étend TOUJOURS à l'opposé du sens de balayage.
 */
export function buildSweepTrailFeatures(
  lng: number,
  lat: number,
  headingDeg: number,
  direction: number,
  headHalfWidthDeg: number,
  trailDeg: number,
  radiusKm: number,
  trailSteps: number = 24,
) {
  const features = [
    {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [buildRadarSector(lng, lat, headingDeg, headHalfWidthDeg, radiusKm)],
      },
      properties: { fade: 1 },
    },
  ]

  // Traîne : commence pile après le bord arrière du faisceau, s'étend sur
  // trailDeg de plus, en tranches fines. Décroissance exponentielle (fade²)
  // pour que la traîne s'efface vite plutôt que de traîner en dégradé plat.
  const stepWidth = trailDeg / trailSteps
  for (let i = 0; i < trailSteps; i++) {
    const from = headingDeg - direction * (headHalfWidthDeg + stepWidth * (i + 1))
    const to = headingDeg - direction * (headHalfWidthDeg + stepWidth * i)
    const mid = (from + to) / 2
    const half = Math.abs(to - from) / 2
    const linearFade = 1 - i / trailSteps
    features.push({
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [buildRadarSector(lng, lat, mid, half, radiusKm)] },
      properties: { fade: linearFade * linearFade },
    })
  }
  return features
}
