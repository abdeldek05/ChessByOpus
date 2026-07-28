interface AnalyticsPanelProps {
  title: string
  children: React.ReactNode
  /** Classes du conteneur (placement dans la grille de la page). */
  className?: string
  /** Classes du corps — à surcharger pour un contenu 3D qui doit occuper toute
   *  la place sans marge intérieure. */
  bodyClassName?: string
}

/**
 * Cadre commun des panneaux du débrief : un titre discret en capitales espacées
 * et un corps délimité. Centraliser ce chrome garantit que les quatre zones de
 * la page (télémétrie, couverture 3D, coupe 2D, bilan) se lisent comme un seul
 * instrument, et qu'un ajustement de style les suit toutes.
 */
export function AnalyticsPanel({
  title,
  children,
  className = '',
  bodyClassName = 'min-h-0 flex-1 p-3',
}: AnalyticsPanelProps) {
  return (
    <section className={`flex min-h-0 flex-col ${className}`}>
      <h2 className="type-eyebrow mb-2 shrink-0 text-ink-dim">
        {title}
      </h2>
      <div className={`hud-plate clip-corner-14 ${bodyClassName}`}>
        {children}
      </div>
    </section>
  )
}
