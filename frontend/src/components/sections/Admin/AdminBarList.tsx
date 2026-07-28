interface AdminBarListItem {
  label: string
  count: number
}

interface AdminBarListProps {
  items: AdminBarListItem[]
}

/**
 * Classement en barres horizontales, piste arrondie et barre en dégradé cyan —
 * même famille visuelle que les barres de progression de la référence.
 *
 * Barres proportionnelles au MAXIMUM de la série (et non au total) : l'écart
 * entre le 1er et le 2e reste lisible même quand une seule valeur écrase
 * toutes les autres.
 *
 * La largeur est une valeur calculée à l'exécution → seule exception admise à
 * l'interdiction du style inline (voir CLAUDE.md §3).
 */
export function AdminBarList({ items }: AdminBarListProps) {
  if (items.length === 0) {
    return <p className="text-body text-ink-dim">Aucune donnée.</p>
  }

  const max = Math.max(...items.map((item) => item.count), 1)

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const widthPercent = `${Math.round((item.count / max) * 100)}%`
        return (
          <li key={item.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="truncate text-micro text-ink">{item.label}</span>
              <span className="font-mono text-micro text-ink-dim">{item.count}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-bright"
                style={{ width: widthPercent }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
