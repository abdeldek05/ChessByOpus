import { AdminPanel } from './AdminPanel'
import { LoginEventRow } from './LoginEventRow'
import type { AdminSecurity } from '@/types/admin.types'

interface LoginJournalProps {
  security: AdminSecurity
}

/** Journal des connexions : IP, date, navigateur, issue de chaque tentative. */
export function LoginJournal({ security }: LoginJournalProps) {
  const { loginEvents, recentFailures } = security

  const badge = (
    <span
      className={`type-label-tight whitespace-nowrap ${recentFailures > 0 ? 'text-alert' : 'text-ink-faint'}`}
    >
      {recentFailures} échec{recentFailures > 1 ? 's' : ''} / 24 h
    </span>
  )

  return (
    <AdminPanel title="Journal des connexions" badge={badge}>
      {loginEvents.length === 0 ? (
        <p className="text-body text-ink-dim">Aucune connexion enregistrée.</p>
      ) : (
        // `overflow-x-auto` : sur écran étroit le tableau défile dans son propre
        // cadre au lieu d'élargir la page entière.
        <div className="max-h-96 overflow-x-auto overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="type-label-tight text-ink-faint">
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">Date</th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">Issue</th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">Identifiant</th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">Adresse IP</th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">Navigateur</th>
                <th className="pb-2 font-medium whitespace-nowrap">Détail</th>
              </tr>
            </thead>
            <tbody>
              {loginEvents.map((event) => (
                <LoginEventRow key={event.id} event={event} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPanel>
  )
}
