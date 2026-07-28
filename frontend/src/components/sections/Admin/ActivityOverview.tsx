import { AdminPanel } from './AdminPanel'
import { AdminStat } from './AdminStat'
import { AdminBarList } from './AdminBarList'
import { ActivityTimeline } from './ActivityTimeline'
import { toRoleBar } from '@/lib/toRoleBar'
import type { AdminActivity } from '@/types/admin.types'

interface ActivityOverviewProps {
  activity: AdminActivity
}

/** Activité métier : ce que disent les missions et scénarios enregistrés. */
export function ActivityOverview({ activity }: ActivityOverviewProps) {
  const { totals, topSites, timeline, radarUsage, roles, averageFleetSize } = activity

  return (
    <AdminPanel title="Activité">
      <div className="grid grid-cols-3 gap-6">
        <AdminStat label="Missions" value={String(totals.missions)} />
        <AdminStat label="Scénarios" value={String(totals.scenarios)} />
        <AdminStat label="Mésanges / scénario" value={averageFleetSize.toFixed(1)} />
      </div>

      <div className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-2">
        <div>
          <p className="type-label-tight mb-3 text-ink-faint">Scénarios par jour (14 j)</p>
          <ActivityTimeline points={timeline} />
        </div>

        <div>
          <p className="type-label-tight mb-3 text-ink-faint">Sites les plus utilisés</p>
          <AdminBarList items={topSites.map((site) => ({ label: site.name, count: site.count }))} />
        </div>

        <div>
          <p className="type-label-tight mb-3 text-ink-faint">Rôles CHESS déployés</p>
          <AdminBarList items={roles.map(toRoleBar)} />
        </div>

        <div>
          <p className="type-label-tight mb-3 text-ink-faint">Modèles de radar</p>
          <AdminBarList
            items={radarUsage.map((radar) => ({ label: radar.templateId, count: radar.count }))}
          />
        </div>
      </div>
    </AdminPanel>
  )
}
