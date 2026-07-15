import { useCallback, useState } from 'react'
import type { TelemetrySeries } from '@/hooks/useFlightTelemetrySeries'

interface UseSparklineHoverResult {
  /** Point survolé (null = souris hors du graphique). */
  hovered: { t: number; value: number } | null
  /** Fraction 0-1 de la position du curseur le long de l'axe temps. */
  hoverFrac: number | null
  onPointerMove: (event: React.PointerEvent<SVGSVGElement>) => void
  onPointerLeave: () => void
}

/** Trouve le point de la série le plus proche d'une fraction temporelle donnée. */
function closestPoint(series: TelemetrySeries, frac: number): { t: number; value: number } {
  const targetT = frac * series.points[series.points.length - 1].t
  let closest = series.points[0]
  let bestDelta = Math.abs(closest.t - targetT)
  for (const point of series.points) {
    const delta = Math.abs(point.t - targetT)
    if (delta < bestDelta) {
      closest = point
      bestDelta = delta
    }
  }
  return closest
}

/** Survol d'un sparkline : convertit la position souris en point de série le plus proche (crosshair + tooltip). */
export function useSparklineHover(series: TelemetrySeries): UseSparklineHoverResult {
  const [hoverFrac, setHoverFrac] = useState<number | null>(null)

  const onPointerMove = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    setHoverFrac(frac)
  }, [])

  const onPointerLeave = useCallback(() => setHoverFrac(null), [])

  const hovered = hoverFrac === null ? null : closestPoint(series, hoverFrac)

  return { hovered, hoverFrac, onPointerMove, onPointerLeave }
}
