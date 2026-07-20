// Pastilles de la légende — classes CSS dédiées (.corridor-dot--*, voir
// index.css) plutôt que couleur inline : miroir des couleurs du corridor,
// lisibles dans le panneau 2D.
const LEGEND = [
  { dot: 'corridor-dot--r1', label: 'Tracked — radar 1' },
  { dot: 'corridor-dot--r2', label: 'Tracked — radar 2' },
  { dot: 'corridor-dot--blind', label: 'Blind — no radar' },
] as const

/**
 * Légende holographique du corridor de visibilité (coin bas-gauche pendant le
 * vol) : explique en une phrase ce que montre la ligne colorée tracée derrière
 * la fusée, avec le code couleur. Auto-explicatif — le client manipule seul,
 * il doit comprendre sans qu'on lui explique. Rendu pur (aucun état).
 */
export function CorridorLegend() {
  return (
    <div className="hud-holo pointer-events-none absolute bottom-8 left-8 w-64 p-4">
      <p className="font-fine text-[10px] font-light tracking-[0.28em] text-accent-bright uppercase">
        Radar visibility
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-ink">
        The trail behind the threat shows, at each instant, whether a radar can see it.
      </p>
      <ul className="mt-3 space-y-1.5">
        {LEGEND.map(({ color, label }) => (
          <li key={label} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-mono text-[11px] text-ink-dim">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
