import type { ReactNode } from 'react'

interface LoginPanelProps {
  children: ReactNode
}

/**
 * Plaque du terminal d'accès : coins biseautés (`clip-corner-18`) et fond creusé
 * dans la page — pas un rectangle bordé « par défaut ». Le repère laiton en
 * en-tête reprend le langage des panneaux du HUD de vol.
 */
export function LoginPanel({ children }: LoginPanelProps) {
  return (
    <div className="clip-corner-18 mt-10 bg-surface/60 px-8 pt-7 pb-9">
      <div className="mb-8 flex items-center gap-3">
        {/* Losange laiton : même marqueur que les repères de la carte tactique. */}
        <span aria-hidden className="size-1.5 rotate-45 bg-accent-bright" />
        <span className="type-eyebrow text-accent-bright">Access terminal</span>
        {/* Filet qui court jusqu'au bord et s'éteint : cadre suggéré, pas fermé. */}
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>

      {children}
    </div>
  )
}
