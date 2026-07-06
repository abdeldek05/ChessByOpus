import type { TelemetryStatRow } from './telemetry.types'

interface TelemetryStatProps {
  row: TelemetryStatRow
}

const VALUE_TINT = {
  ok: 'text-white',
  warn: 'text-warning',
  crit: 'text-danger',
} as const

/**
 * Ligne de lecture simple (intitulé + grande valeur) pour un compteur de
 * détection ou le chrono mission. Pas de bascule — juste une valeur mise en
 * avant, teintée selon l'alerte.
 */
export function TelemetryStat({ row }: TelemetryStatProps) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <p className="text-[10px] tracking-[0.14em] text-white/45 uppercase">{row.label}</p>
      <p className={`text-lg font-bold tracking-wide tabular-nums ${VALUE_TINT[row.alert]}`}>
        {row.value}
      </p>
    </div>
  )
}
