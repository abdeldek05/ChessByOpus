import { useConfirmLaunchSite } from '@/hooks/useConfirmLaunchSite'
import type { LaunchSite } from '@/types/simulation.types'

interface SiteInfoPanelProps {
  site: LaunchSite | null
}

const BUTTON_LABEL = {
  idle: 'Confirm site',
  saving: 'Saving',
  saved: 'Site confirmed',
  error: 'Failed — retry',
} as const

export function SiteInfoPanel({ site }: SiteInfoPanelProps) {
  const { status, confirm } = useConfirmLaunchSite()

  if (!site) return null

  const busy = status === 'saving' || status === 'saved'

  return (
    <div className="absolute bottom-6 left-6 w-80 rounded-2xl bg-surface/90 p-6 shadow-2xl shadow-black/50 backdrop-blur-md">
      <p className="font-display text-[10px] font-semibold tracking-[0.22em] text-accent uppercase">
        Launch site · {site.country}
      </p>
      <h2 className="mt-1 font-title text-2xl leading-tight tracking-wide text-ink">{site.name}</h2>

      <dl className="mt-5 space-y-2.5 font-display text-xs">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-faint">Operator</dt>
          <dd className="text-right text-ink-dim">{site.operator}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-faint">Coord. DD</dt>
          <dd className="text-right text-ink tabular-nums">
            {site.latitude.toFixed(4)}° · {site.longitude.toFixed(4)}°
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-faint">Elevation</dt>
          <dd className="text-right text-ink tabular-nums">{site.elevation} m</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => confirm(site)}
        disabled={busy}
        className="group mt-6 flex w-full items-center justify-between rounded-xl bg-accent px-5 py-3.5 font-display text-sm font-semibold tracking-wide text-bg transition-colors duration-300 hover:bg-accent-bright disabled:opacity-60"
      >
        <span>{BUTTON_LABEL[status]}</span>
        <span className="text-lg leading-none transition-transform duration-300 group-hover:translate-x-1">→</span>
      </button>
    </div>
  )
}
