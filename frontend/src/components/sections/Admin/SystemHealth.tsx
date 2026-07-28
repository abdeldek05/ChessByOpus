import { AdminPanel } from './AdminPanel'
import { AdminStat } from './AdminStat'
import { formatBytes, formatDuration, formatEventDate } from '@/lib/formatAdminValues'
import type { AdminSystem } from '@/types/admin.types'

interface SystemHealthProps {
  system: AdminSystem
}

/** Santé du backend : uptime, base, performance et échecs de /simulate. */
export function SystemHealth({ system }: SystemHealthProps) {
  const badge = <span className="type-label-tight whitespace-nowrap text-ok">En ligne</span>

  const averageLabel =
    system.simulateAverageSeconds === null ? '—' : `${system.simulateAverageSeconds.toFixed(1)} s`

  return (
    <AdminPanel title="Système" badge={badge}>
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <AdminStat label="Uptime" value={formatDuration(system.uptimeSeconds)} />
        <AdminStat label="Base de données" value={formatBytes(system.databaseBytes)} />
        <AdminStat label="/simulate moyen" value={averageLabel} />
        <AdminStat
          label="Échecs simulation"
          value={`${system.simulateFailures} / ${system.simulateCount}`}
          alert={system.simulateFailures > 0}
        />
      </div>

      <dl className="mt-6 flex flex-col gap-1.5 text-micro">
        <div className="flex gap-3">
          <dt className="text-ink-faint">Démarré</dt>
          <dd className="font-mono text-ink-dim">{formatEventDate(system.startedAt)}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="text-ink-faint">Dernière simulation réussie</dt>
          <dd className="font-mono text-ink-dim">
            {system.lastSuccessAt ? formatEventDate(system.lastSuccessAt) : '—'}
          </dd>
        </div>
        {system.lastFailureAt && (
          <div className="flex gap-3">
            <dt className="text-ink-faint">Dernier échec</dt>
            <dd className="font-mono text-alert">
              {formatEventDate(system.lastFailureAt)}
              {system.lastFailureError ? ` — ${system.lastFailureError}` : ''}
            </dd>
          </div>
        )}
      </dl>
    </AdminPanel>
  )
}
