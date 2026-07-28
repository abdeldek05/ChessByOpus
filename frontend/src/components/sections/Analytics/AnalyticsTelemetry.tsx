import { TelemetrySparkline } from '../Lancement/TelemetrySparkline'
import { useFlightTelemetrySeries } from '@/hooks/useFlightTelemetrySeries'
import type { FlightData } from '@/lib/api'

interface AnalyticsTelemetryProps {
  flight: FlightData
}

/**
 * Colonne de télémétrie du débrief : les six courbes du vol (altitude, vitesse,
 * position, cap, pente) survolables pour lire une valeur à un instant donné.
 *
 * Réutilise les MÊMES briques que le HUD de vol (useFlightTelemetrySeries +
 * TelemetrySparkline) sans son enveloppe : le panneau de vol est un overlay
 * positionné en absolu sur la scène 3D, inadapté à une grille de page. Seul le
 * contenu est partagé, donc les deux affichages ne peuvent pas diverger.
 */
export function AnalyticsTelemetry({ flight }: AnalyticsTelemetryProps) {
  const series = useFlightTelemetrySeries(flight)
  if (!series) return null

  return (
    <div className="space-y-4">
      <TelemetrySparkline label="Altitude" unit="m" series={series.altitudeM} />
      <TelemetrySparkline label="Speed" unit="m/s" series={series.speedMs} />
      <TelemetrySparkline label="East (X)" unit="m" series={series.eastM} />
      <TelemetrySparkline label="North (Y)" unit="m" series={series.northM} />
      <TelemetrySparkline label="Heading" unit="°" series={series.azimuthDeg} decimals={1} />
      <TelemetrySparkline label="Path elevation" unit="°" series={series.elevationDeg} decimals={1} />
    </div>
  )
}
