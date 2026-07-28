import type { ReactNode } from 'react'

interface AdminPanelProps {
  title: string
  /** Valeur mise en avant à droite du titre (compteur, statut). */
  badge?: ReactNode
  children: ReactNode
}

/**
 * Carte du tableau de bord : fond plein arrondi, ZÉRO bordure ni biseau — la
 * hiérarchie vient du contraste de ton avec la page (`bg-surface` sur
 * `bg-bg`), pas d'un contour. Registre « poste de supervision » (dashboard
 * d'astreinte), délibérément différent du HUD laiton/biseauté du reste du
 * site : ce vocabulaire angulaire a déjà été essayé ailleurs et rejeté.
 */
export function AdminPanel({ title, badge, children }: AdminPanelProps) {
  return (
    <section className="rounded-3xl bg-surface p-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <h2 className="type-label-tight text-ink-dim">{title}</h2>
        {badge}
      </header>

      {children}
    </section>
  )
}
