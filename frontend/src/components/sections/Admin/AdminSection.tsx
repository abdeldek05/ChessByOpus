import { useAdminOverview } from '@/hooks/useAdminOverview'
import { LoginJournal } from './LoginJournal'
import { ActiveSessions } from './ActiveSessions'
import { ActivityOverview } from './ActivityOverview'
import { SystemHealth } from './SystemHealth'
import { AdminRefreshButton } from './AdminRefreshButton'

/** Tableau de bord Admin. Orchestre les quatre panneaux, ne calcule rien. */
export function AdminSection() {
  const { data, error, isLoading, reload, revoke } = useAdminOverview()

  return (
    <section className="min-h-screen bg-bg px-6 pt-32 pb-20">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="type-label font-mono text-accent">Console</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] font-semibold text-ink">Admin</h1>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={reload} />
        </div>

        {error && (
          <p role="alert" className="type-label-tight mt-8 rounded-2xl bg-alert/10 px-4 py-3 text-alert">
            {error}
          </p>
        )}

        {data && (
          <div className="mt-10 flex flex-col gap-6">
            <SystemHealth system={data.system} />
            <ActiveSessions security={data.security} onRevoke={revoke} />
            <LoginJournal security={data.security} />
            <ActivityOverview activity={data.activity} />
          </div>
        )}
      </div>
    </section>
  )
}
