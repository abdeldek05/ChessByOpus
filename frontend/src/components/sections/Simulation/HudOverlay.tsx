import { Link } from 'react-router-dom'
import { launchSites } from '@/data/launchSites'

export function HudOverlay() {
  const siteCount = String(launchSites.length).padStart(2, '0')

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="hud-vignette absolute inset-0" />

      {/* En-tête de campagne (haut gauche) */}
      <div className="absolute top-7 left-10">
        <Link
          to="/"
          className="group pointer-events-auto inline-flex items-center gap-1.5 font-display text-[10px] tracking-[0.2em] text-ink-faint uppercase transition-colors hover:text-accent-bright"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Mesange
        </Link>
        <p className="mt-4 font-display text-[10px] tracking-[0.28em] text-accent uppercase">
          Opus Aerospace · CHESS
        </p>
        <h1 className="mt-1 font-display text-2xl leading-tight font-medium text-ink">
          Campagne de tir
        </h1>
      </div>

      {/* Télémétrie (bas droite, au-dessus de l'attribution MapLibre) */}
      <div className="absolute right-10 bottom-14 text-right font-display text-[10px] leading-relaxed tracking-[0.2em] text-ink-faint uppercase">
        <p>
          <span className="text-accent tabular-nums">{siteCount}</span> sites de tir disponibles
        </p>
        <p>Sélectionnez une base sur la carte</p>
      </div>
    </div>
  )
}
