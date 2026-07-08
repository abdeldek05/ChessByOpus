import { Link } from 'react-router-dom'

export function HudOverlay() {
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
    </div>
  )
}
