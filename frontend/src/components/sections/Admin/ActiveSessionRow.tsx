import type { ActiveSession } from '@/types/admin.types'
import { formatEventDate, formatUserAgent } from '@/lib/formatAdminValues'

interface ActiveSessionRowProps {
  session: ActiveSession
  /** Session de l'admin qui consulte : signalée, et non révocable. */
  isCurrent: boolean
  onRevoke: (jti: string) => void
}

export function ActiveSessionRow({ session, isCurrent, onRevoke }: ActiveSessionRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-surface-2 px-4 py-3">
      <span className="font-mono text-micro text-ink">{session.ip}</span>
      <span className="text-micro text-ink-faint">{formatUserAgent(session.userAgent)}</span>
      <span className="font-mono text-micro text-ink-dim">
        depuis {formatEventDate(session.createdAt)}
      </span>

      {isCurrent ? (
        <span className="type-label-tight ml-auto text-accent-bright">Votre session</span>
      ) : (
        <button
          type="button"
          onClick={() => onRevoke(session.jti)}
          className="type-label-tight ml-auto text-ink-faint transition-colors duration-300 ease-out hover:text-alert"
        >
          Révoquer
        </button>
      )}
    </div>
  )
}
