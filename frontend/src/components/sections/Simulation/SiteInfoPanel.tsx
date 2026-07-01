import { useConfirmLaunchSite } from '@/hooks/useConfirmLaunchSite'
import type { LaunchSite } from '@/types/simulation.types'

interface SiteInfoPanelProps {
  site: LaunchSite | null
}

const BUTTON_LABEL = {
  idle: 'Confirmer →',
  saving: 'Enregistrement…',
  saved: 'Confirmé ✓',
  error: 'Échec — réessayer',
} as const

export function SiteInfoPanel({ site }: SiteInfoPanelProps) {
  const { status, confirm } = useConfirmLaunchSite()

  if (!site) return null

  const coordinates = `${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)}`

  return (
    <div className="absolute bottom-6 left-6 w-72 border border-accent bg-bg/80 p-5 font-mono backdrop-blur">
      <p className="text-[11px] tracking-[0.2em] text-ink-dim uppercase">Site de lancement</p>
      <h2 className="mt-1 text-lg font-bold text-ink">{site.name}</h2>

      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-dim">Opérateur</dt>
          <dd className="text-right text-ink">{site.operator}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-dim">Coordonnées</dt>
          <dd className="text-right text-ink">{coordinates}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-dim">Élévation</dt>
          <dd className="text-right text-ink">{site.elevation} m</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => confirm(site)}
        disabled={status === 'saving' || status === 'saved'}
        className="mt-5 w-full border border-accent px-4 py-2 text-xs tracking-[0.15em] text-accent uppercase transition-colors duration-300 ease-out hover:bg-accent hover:text-bg disabled:cursor-default disabled:opacity-70 disabled:hover:bg-transparent disabled:hover:text-accent"
      >
        {BUTTON_LABEL[status]}
      </button>
    </div>
  )
}
