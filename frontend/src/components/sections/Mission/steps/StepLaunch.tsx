import { computeDistanceKm, formatDistance } from '@/lib/computeDistanceKm'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarConfig } from '@/types/radar.types'
import type { MesangeLaunchConfig, RadarPosition } from '@/types/mission.types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface StepLaunchProps {
  site: LaunchSite
  radarConfig: RadarConfig
  radarPosition: RadarPosition
  mesangeConfigs: MesangeLaunchConfig[]
  saveStatus: SaveStatus
  onSave: () => void
  onLaunch: () => void
}

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: 'Enregistrer le scénario',
  saving: 'Enregistrement…',
  saved: 'Scénario enregistré ✓',
  error: 'Échec — réessayer',
}

export function StepLaunch({ site, radarConfig, radarPosition, mesangeConfigs, saveStatus, onSave, onLaunch }: StepLaunchProps) {
  const distance = formatDistance(computeDistanceKm(site, radarPosition))

  const rows = [
    { label: 'Base de lancement', value: site.name, accent: false },
    { label: 'Radar', value: `${radarConfig.name} · ${radarConfig.rangeKm} km`, accent: false },
    { label: 'Distance radar', value: distance, accent: true },
    { label: 'Mesange engagées', value: String(mesangeConfigs.length), accent: false },
  ]

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-center gap-6">
      <p className="text-[10px] font-semibold tracking-[0.24em] text-ink-dim uppercase">
        Récapitulatif de mission
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

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saveStatus === 'saving' || saveStatus === 'saved'}
          className="w-full rounded-full bg-surface-2 px-4 py-3.5 text-xs font-semibold tracking-wide text-ink transition-colors duration-200 hover:text-accent-bright disabled:opacity-40"
        >
          {SAVE_LABEL[saveStatus]}
        </button>
        <button
          type="button"
          onClick={onLaunch}
          className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3.5 text-xs font-semibold tracking-wide text-bg shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-bright hover:shadow-xl active:translate-y-0"
        >
          Lancer la mission
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>
  )
}
