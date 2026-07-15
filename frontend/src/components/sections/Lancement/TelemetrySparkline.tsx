import { useSparklineHover } from '@/hooks/useSparklineHover'
import type { TelemetrySeries } from '@/hooks/useFlightTelemetrySeries'

interface TelemetrySparklineProps {
  label: string
  unit: string
  series: TelemetrySeries
  /** Nombre de décimales affichées dans le tooltip (0 = entier). */
  decimals?: number
}

const WIDTH = 100
const HEIGHT = 40
const PAD_Y = 4

/** Construit le chemin SVG (coordonnées 0-100 x 0-40) d'une série temps→valeur. */
function buildPath(series: TelemetrySeries): string {
  const { points, min, max } = series
  const tMax = points[points.length - 1].t || 1
  const span = max - min || 1
  return points
    .map((p, i) => {
      const x = (p.t / tMax) * WIDTH
      const y = HEIGHT - PAD_Y - ((p.value - min) / span) * (HEIGHT - 2 * PAD_Y)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

/**
 * Un petit multiple de télémétrie de vol : une grandeur en fonction du temps,
 * ligne + crosshair + tooltip au survol. Jamais deux grandeurs sur le même
 * axe — chaque sparkline a sa propre échelle, affichée à côté du titre.
 */
export function TelemetrySparkline({ label, unit, series, decimals = 0 }: TelemetrySparklineProps) {
  const { hovered, hoverFrac, onPointerMove, onPointerLeave } = useSparklineHover(series)
  const path = buildPath(series)
  const crosshairX = hoverFrac === null ? null : hoverFrac * WIDTH

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-semibold tracking-[0.1em] text-white/60 uppercase">{label}</p>
        <p className="font-mono text-[10px] text-white/40">
          {hovered ? `${hovered.value.toFixed(decimals)} ${unit}` : `${series.min.toFixed(decimals)}–${series.max.toFixed(decimals)} ${unit}`}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-12 w-full cursor-crosshair"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <path d={path} fill="none" stroke="var(--color-accent-bright)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        {crosshairX !== null && (
          <line x1={crosshairX} x2={crosshairX} y1={0} y2={HEIGHT} stroke="var(--color-ink-dim)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
    </div>
  )
}
