import { ROLE_COLOR } from '@/constants/tacticalMapTheme'
import { SWEEP_SEARCH_COLOR } from '@/constants/tacticalRadar'

/** Une entrée de légende : une pastille colorée + son libellé. */
interface LegendEntry {
  color: string
  label: string
  /** Pastille en trait (piste) plutôt qu'en point plein. */
  line?: boolean
}

// Code couleur de la carte tactique — aligné sur ROLE_COLOR (pistes/têtes des
// mésanges) et le faisceau radar. Libellés cohérents avec getMesangeRoleLabel
// (King / Main decoy / Decoy). Explique d'un coup d'œil ce qu'on voit.
const ENTRIES: LegendEntry[] = [
  { color: ROLE_COLOR.KING, label: 'King — threat', line: true },
  { color: ROLE_COLOR.QUEEN, label: 'Main decoy', line: true },
  { color: ROLE_COLOR.PAWN, label: 'Decoy', line: true },
  { color: SWEEP_SEARCH_COLOR, label: 'Radar beam' },
]

/**
 * Légende de la carte tactique (coin, style hud-holo laiton) : explique le
 * code couleur des pistes (Roi/Dame/Pion, aligné sur ROLE_COLOR partout dans
 * l'app) et le faisceau radar — la carte affiche maintenant TOUTE la flotte en
 * live, il faut savoir qui est qui d'un coup d'œil. Rendu pur, aucun état.
 */
export function TacticalLegend() {
  return (
    <div className="hud-holo pointer-events-none absolute bottom-3 left-3 z-10 px-3 py-2">
      <ul className="space-y-1.5">
        {ENTRIES.map((entry) => (
          <li key={entry.label} className="flex items-center gap-2">
            <span
              className={entry.line ? 'h-0.5 w-4 rounded-full' : 'h-2.5 w-2.5 rounded-full'}
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-mono text-[10px] tracking-[0.1em] text-ink-dim uppercase">{entry.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
