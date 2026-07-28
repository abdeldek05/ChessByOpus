import { AdminPanel } from './AdminPanel'
import { ActiveSessionRow } from './ActiveSessionRow'
import type { AdminSecurity } from '@/types/admin.types'

interface ActiveSessionsProps {
  security: AdminSecurity
  onRevoke: (jti: string) => void
}

/** Qui est connecté en ce moment, et depuis où. */
export function ActiveSessions({ security, onRevoke }: ActiveSessionsProps) {
  const { activeSessions, currentJti, callerIp } = security

  const badge = (
    <span className="type-label-tight whitespace-nowrap text-ink-faint">
      vous : {callerIp}
    </span>
  )

  return (
    <AdminPanel title="Sessions actives" badge={badge}>
      {activeSessions.length === 0 ? (
        <p className="text-body text-ink-dim">Aucune session ouverte.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {activeSessions.map((session) => (
            <ActiveSessionRow
              key={session.jti}
              session={session}
              isCurrent={session.jti === currentJti}
              onRevoke={onRevoke}
            />
          ))}
        </div>
      )}
    </AdminPanel>
  )
}
