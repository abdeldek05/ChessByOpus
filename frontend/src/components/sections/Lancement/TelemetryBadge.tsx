import type { TelemetryBadgeRow } from './telemetry.types'

interface TelemetryBadgeProps {
  row: TelemetryBadgeRow
}

const ALERT_STYLE = {
  ok: 'border-success/50 bg-success/10 text-success',
  warn: 'border-warning/50 bg-warning/10 text-warning',
  crit: 'border-danger/50 bg-danger/10 text-danger',
} as const

/**
 * Ligne de statut simple : intitulé au-dessus, une seule pastille affichant
 * l'état courant (ex. « DÉTECTÉE »). Contrairement à l'ancien toggle à deux
 * options, il n'y a rien à comparer — juste l'état actuel, teinté par alerte.
 */
export function TelemetryBadge({ row }: TelemetryBadgeProps) {
  return (
    <div className="mb-2">
      <p className="mb-0.5 text-[10px] tracking-[0.14em] text-white/45 uppercase">{row.label}</p>
      <span
        className={`inline-block border px-3 py-1 text-[10px] font-bold tracking-[0.12em] uppercase ${ALERT_STYLE[row.alert]}`}
        style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
      >
        {row.value}
      </span>
    </div>
  )
}
