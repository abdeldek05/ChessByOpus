import type { LoginEvent } from '@/types/admin.types'
import {
  formatEventDate,
  formatFailureReason,
  formatUserAgent,
} from '@/lib/formatAdminValues'

interface LoginEventRowProps {
  event: LoginEvent
}

/** Une ligne du journal : quand, qui, d'où, avec quel navigateur, et l'issue. */
export function LoginEventRow({ event }: LoginEventRowProps) {
  const isBlocked = event.failureReason === 'rate_limited'

  // Un blocage se distingue d'un simple échec : c'est le signe d'une rafale de
  // tentatives, donc l'événement qui doit accrocher l'œil en premier.
  const verdictClass = event.success
    ? 'text-ok'
    : isBlocked
      ? 'text-warning'
      : 'text-alert'

  return (
    // Séparation par ton (fond légèrement relevé), pas par filet : cohérent
    // avec le reste de la carte, aucune bordure dure dans ce registre.
    <tr className="odd:bg-surface-2">
      <td className="rounded-l-lg py-2.5 pr-4 pl-3 font-mono text-micro whitespace-nowrap text-ink-dim">
        {formatEventDate(event.createdAt)}
      </td>
      <td className={`py-2.5 pr-4 type-label-tight whitespace-nowrap ${verdictClass}`}>
        {event.success ? 'OK' : isBlocked ? 'BLOQUÉ' : 'ÉCHEC'}
      </td>
      <td className="py-2.5 pr-4 font-mono text-micro whitespace-nowrap text-ink">
        {event.username}
      </td>
      <td className="py-2.5 pr-4 font-mono text-micro whitespace-nowrap text-ink-dim">
        {event.ip}
      </td>
      <td className="py-2.5 pr-4 text-micro whitespace-nowrap text-ink-faint">
        {formatUserAgent(event.userAgent)}
      </td>
      <td className="rounded-r-lg py-2.5 pr-3 text-micro text-ink-faint">
        {formatFailureReason(event.failureReason)}
      </td>
    </tr>
  )
}
