import { isSameSelection, type ProfileSelection } from '@/types/coverageProfile.types'

/** Une entrée de légende : la courbe qu'elle désigne + son libellé et sa teinte. */
export interface ProfileLegendItem {
  selection: NonNullable<ProfileSelection>
  label: string
  /** Classe Tailwind de la pastille (token, jamais une couleur en dur). */
  swatchClass: string
}

interface CoverageProfileLegendProps {
  items: ProfileLegendItem[]
  selection: ProfileSelection
  /** Clic sur une entrée : sélectionne, ou désélectionne si déjà active. */
  onSelect: (selection: ProfileSelection) => void
}

/**
 * Légende du profil de couverture, qui sert AUSSI de sélecteur : cliquer une
 * entrée illumine la courbe correspondante dans le graphe 3D et estompe les
 * autres — et réciproquement, cliquer une courbe dans le graphe met son entrée
 * en avant ici. Les deux pilotent le même état, il n'y a donc jamais de
 * désaccord entre ce que la légende annonce et ce que le graphe montre.
 *
 * Recliquer l'entrée active désélectionne (retour au repos) : pas besoin de
 * chercher une croix ou une zone vide pour sortir de l'état.
 */
export function CoverageProfileLegend({ items, selection, onSelect }: CoverageProfileLegendProps) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-accent-bright/15 px-4 py-2.5">
      {items.map((item) => {
        const active = isSameSelection(selection, item.selection)
        return (
          <li key={`${item.selection.kind}-${item.label}`}>
            <button
              type="button"
              onClick={() => onSelect(active ? null : item.selection)}
              aria-pressed={active}
              className={`flex items-center gap-2 transition-opacity ${
                selection !== null && !active ? 'opacity-40 hover:opacity-70' : 'opacity-100'
              }`}
            >
              <span className={`h-0.5 w-4 ${item.swatchClass} ${active ? 'h-1' : ''}`} />
              <span
                className={`font-mono text-[10px] tracking-[0.16em] uppercase ${
                  active ? 'text-ink' : 'text-ink-dim'
                }`}
              >
                {item.label}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
