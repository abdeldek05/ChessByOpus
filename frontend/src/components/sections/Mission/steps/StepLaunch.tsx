import { computeDistanceKm, formatDistance } from '@/lib/computeDistanceKm'
import type { LaunchSite } from '@/types/simulation.types'
import type { MesangeLaunchConfig, PlacedRadar } from '@/types/mission.types'
import type { ScenarioViolation } from '@/lib/validateScenario'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface StepLaunchProps {
  site: LaunchSite
  /** Tous les radars du scénario (1-2), avec leur config + position. */
  radars: PlacedRadar[]
  mesangeConfigs: MesangeLaunchConfig[]
  saveStatus: SaveStatus
  violations: ScenarioViolation[]
  canLaunch: boolean
  onSave: () => void
  onLaunch: () => void
}

interface RecapRow {
  label: string
  value: string
  accent: boolean
}

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: 'Save scenario',
  saving: 'Saving…',
  saved: 'Scenario saved ✓',
  error: 'Failed — retry',
}

export function StepLaunch({
  site,
  radars,
  mesangeConfigs,
  saveStatus,
  violations,
  canLaunch,
  onSave,
  onLaunch,
}: StepLaunchProps) {
  // Le récap reflète TOUS les radars choisis : chacun donne sa config (nom,
  // portée) et sa distance au pas de tir. Le préfixe « Radar N » n'apparaît
  // qu'en multi-radar, pour ne pas alourdir le cas nominal à un seul radar.
  const multi = radars.length > 1
  const radarRows: RecapRow[] = radars.flatMap((radar, index) => {
    const prefix = multi ? `Radar ${index + 1}` : 'Radar'
    const distance = radar.position ? formatDistance(computeDistanceKm(site, radar.position)) : '—'
    return [
      { label: prefix, value: `${radar.config.name} · ${radar.config.rangeKm} km`, accent: false },
      { label: `${prefix} distance`, value: distance, accent: true },
    ]
  })

  const rows: RecapRow[] = [
    { label: 'Launch base', value: site.name, accent: false },
    ...radarRows,
    { label: 'Mesange engaged', value: String(mesangeConfigs.length), accent: false },
  ]

  const blocked = violations.length > 0
  const savedButNotLaunchable = !blocked && saveStatus !== 'saved'

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-center gap-6">
      <p className="text-[10px] font-semibold tracking-[0.24em] text-ink-dim uppercase">
        Mission summary
      </p>

      <dl className="overflow-hidden rounded-3xl bg-surface">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between px-5 py-3.5 text-sm ${i > 0 ? 'mt-px' : ''}`}
          >
            <dt className="text-ink-dim">{row.label}</dt>
            <dd className={`font-medium ${row.accent ? 'text-accent-bright' : 'text-ink'}`}>{row.value}</dd>
          </div>
        ))}
      </dl>

      {blocked && (
        <ul className="flex flex-col gap-2 rounded-2xl border border-danger/30 bg-danger/5 px-5 py-4">
          {violations.map((violation) => (
            <li key={violation.code} className="flex gap-2 text-xs text-danger">
              <span aria-hidden>▹</span>
              <span>{violation.message}</span>
            </li>
          ))}
        </ul>
      )}

      {savedButNotLaunchable && (
        <p className="rounded-2xl bg-surface px-5 py-3 text-xs text-ink-dim">
          Save the scenario before launching — the trajectory is computed on
          save.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={blocked || saveStatus === 'saving' || saveStatus === 'saved'}
          className="w-full rounded-full bg-surface-2 px-4 py-3.5 text-xs font-semibold tracking-wide text-ink transition-colors duration-200 hover:text-accent-bright disabled:opacity-40"
        >
          {SAVE_LABEL[saveStatus]}
        </button>
        <button
          type="button"
          onClick={onLaunch}
          disabled={!canLaunch}
          className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3.5 text-xs font-semibold tracking-wide text-bg shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-bright hover:shadow-xl active:translate-y-0 disabled:pointer-events-none disabled:opacity-30 disabled:shadow-none"
        >
          Launch mission
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>
  )
}
