import { TelemetryBadge } from './TelemetryBadge'
import { TelemetryStat } from './TelemetryStat'
import type { TelemetryModel } from './telemetry.types'

interface TelemetryPanelProps {
  model: TelemetryModel
}

/**
 * HUD de télémétrie ancré à gauche (style « status board » de la maquette) :
 * en-tête ANOMALIES / ÉTAT SYSTÈME, puis les sections avec leurs lignes à
 * bascule et le mini-graphe. Fond translucide sombre, texte technique fin.
 * Non bloquant sauf sur ses propres éléments.
 */
export function TelemetryPanel({ model }: TelemetryPanelProps) {
  return (
    <aside className="pointer-events-none absolute top-0 left-0 flex h-full w-[400px] max-w-[40vw] flex-col gap-3 bg-gradient-to-r from-black/75 via-black/50 to-transparent px-7 py-5 font-mono">
      {/* En-tête */}
      <div className="flex items-center gap-5 border-b border-white/10 pb-2.5">
        <div>
          <p className="text-[9px] tracking-[0.18em] text-white/40 uppercase">Anomalies</p>
          <p
            className={`text-lg leading-tight font-bold ${
              model.header.anomalies > 0 ? 'text-warning' : 'text-success'
            }`}
          >
            {String(model.header.anomalies).padStart(2, '0')}
          </p>
        </div>
        <div>
          <p className="text-[9px] tracking-[0.18em] text-white/40 uppercase">Système</p>
          <p
            className={`text-lg leading-tight font-bold ${
              model.header.systemHealthy ? 'text-success' : 'text-danger'
            }`}
          >
            {model.header.systemHealthy ? 'OK' : 'KO'}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[9px] tracking-[0.18em] text-white/40 uppercase">Séquence</p>
          <p className="text-sm leading-tight font-bold tracking-[0.1em] whitespace-nowrap text-accent-bright">
            {model.header.phaseLabel}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3.5 overflow-y-auto">
        {model.sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 text-sm font-semibold tracking-[0.06em] text-white/90">
              {section.title}
            </h2>
            {section.rows.map((row, index) =>
              row.kind === 'stat' ? (
                <TelemetryStat key={`${section.title}-${index}`} row={row} />
              ) : (
                <TelemetryBadge key={`${section.title}-${index}`} row={row} />
              ),
            )}
          </section>
        ))}
      </div>
    </aside>
  )
}
