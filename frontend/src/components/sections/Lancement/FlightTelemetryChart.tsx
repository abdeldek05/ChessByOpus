import { TelemetrySparkline } from './TelemetrySparkline'
import { useFlightTelemetrySeries } from '@/hooks/useFlightTelemetrySeries'
import type { FlightData } from '@/lib/api'

interface FlightTelemetryChartProps {
  flight: FlightData | null
}

const CLIP = 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'

/**
 * Télémétrie complète du vol RocketPy : altitude, vitesse, position est/nord
 * et cap/élévation instantanés, chacun en fonction du temps (petits multiples
 * — jamais deux grandeurs sur un même axe). Affiché une fois le vol terminé,
 * à côté du bilan de mission.
 */
export function FlightTelemetryChart({ flight }: FlightTelemetryChartProps) {
  const series = useFlightTelemetrySeries(flight)
  if (!series) return null

  return (
    <aside
      className="pointer-events-auto absolute top-0 right-0 flex h-full w-[360px] max-w-[40vw] flex-col gap-3 overflow-y-auto bg-gradient-to-l from-black/80 via-black/55 to-transparent px-6 py-6 font-mono"
      style={{ clipPath: CLIP }}
    >
      <div className="border-b border-white/10 pb-3">
        <p className="text-[10px] tracking-[0.24em] text-white/40 uppercase">Flight telemetry</p>
        <p className="mt-1 text-sm text-white/80">RocketPy · {series.durationSec.toFixed(1)} s flight</p>
      </div>

      <TelemetrySparkline label="Altitude" unit="m" series={series.altitudeM} />
      <TelemetrySparkline label="Speed" unit="m/s" series={series.speedMs} />
      <TelemetrySparkline label="East (x)" unit="m" series={series.eastM} />
      <TelemetrySparkline label="North (y)" unit="m" series={series.northM} />
      <TelemetrySparkline label="Heading" unit="°" series={series.azimuthDeg} />
      <TelemetrySparkline label="Path elevation" unit="°" series={series.elevationDeg} />
    </aside>
  )
}
