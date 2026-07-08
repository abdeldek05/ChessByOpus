interface SiteSelectPromptProps {
  siteCount: number
  /** Masqué en douceur dès qu'un site est sélectionné. */
  visible: boolean
}

/**
 * Invite « choisir un site de lancement » en bulle glassmorphism (style Apple) :
 * verre dépoli, coins très arrondis, halo doux et repère pulsant. Flotte en bas
 * au centre de la carte et se fond quand un site est retenu.
 */
export function SiteSelectPrompt({ siteCount, visible }: SiteSelectPromptProps) {
  const count = String(siteCount).padStart(2, '0')

  return (
    <div
      className={`pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div className="relative">
        {/* Halo doux derrière le verre */}
        <div className="absolute -inset-3 rounded-[32px] bg-accent/10 blur-2xl" aria-hidden />

        {/* Carte en verre dépoli */}
        <div className="relative flex items-center gap-4 rounded-[24px] border border-white/12 bg-white/[0.07] px-6 py-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {/* Reflet supérieur type Apple */}
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/25" aria-hidden />

          {/* Repère pulsant */}
          <span className="relative flex size-10 items-center justify-center rounded-full bg-accent/15">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent/20" aria-hidden />
            <span className="text-lg leading-none text-accent-bright">◈</span>
          </span>

          <div className="pr-1">
            <p className="font-display text-sm font-medium text-ink">Choisissez un site de lancement</p>
            <p className="mt-0.5 font-display text-[11px] tracking-[0.04em] text-ink-dim">
              <span className="tabular-nums text-accent">{count}</span> bases disponibles · touchez un repère
              sur la carte
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
