import type { TimelinePoint } from '@/types/admin.types'

interface ActivityTimelineProps {
  points: TimelinePoint[]
}

/**
 * Scénarios créés par jour, en histogramme. Les jours à zéro gardent une barre
 * résiduelle visible : un creux doit se lire comme « rien ce jour-là », pas
 * comme un trou dans le graphique.
 *
 * Hauteurs calculées à l'exécution → exception admise au style inline.
 */
export function ActivityTimeline({ points }: ActivityTimelineProps) {
  if (points.length === 0) {
    return <p className="text-body text-ink-dim">Aucune donnée.</p>
  }

  const max = Math.max(...points.map((point) => point.count), 1)

  return (
    <div>
      <div className="flex h-24 items-end gap-1">
        {points.map((point) => {
          const heightPercent = point.count === 0 ? '2%' : `${(point.count / max) * 100}%`
          return (
            <div
              key={point.day}
              title={`${point.day} — ${point.count} scénario${point.count > 1 ? 's' : ''}`}
              className={`flex-1 rounded-t-md ${point.count === 0 ? 'bg-surface-2' : 'bg-gradient-to-t from-accent to-accent-bright'}`}
              style={{ height: heightPercent }}
            />
          )
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-micro text-ink-faint">
        <span>{points[0]?.day.slice(5)}</span>
        <span>{points[points.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  )
}
