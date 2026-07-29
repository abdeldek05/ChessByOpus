import { isSameSelection, type ProfileSelection } from '@/types/coverageProfile.types'

/** Une entrée de légende : la courbe qu'elle désigne + son libellé et sa teinte. */
export interface ProfileLegendItem {
  selection: NonNullable<ProfileSelection>
  label: string
  /** Classe Tailwind de la pastille (token, jamais une couleur en dur). */
  swatchClass: string
  /** Ce que la courbe REPRÉSENTE, en une phrase — sans ça, une pastille et un
   *  nom d'équipement ne disent pas ce qu'on regarde. */
  hint: string
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
 *
 * Chaque entrée est une LIGNE (plus une puce serrée dans un flux) portant sa
 * pastille, son libellé et ce qu'elle représente : la version compacte tenait
 * sur une seule rangée en `type-label-tight`, illisible et muette sur le sens
 * des couleurs. Un bloc de repères de lecture ferme la légende — il explique ce
 * que le graphe encode et qui ne s'y devine pas (dôme, cône de silence,
 * espacement des marques de temps).
 */
export function CoverageProfileLegend({ items, selection, onSelect }: CoverageProfileLegendProps) {
  return (
    <div className="border-t border-accent-bright/15">
      <p className="px-4 pt-2.5 pb-1 font-fine text-[0.65rem] font-light tracking-wide-hud text-ink-faint uppercase">
        Courbes — cliquer pour isoler
      </p>

      <ul className="flex flex-col gap-0.5 px-2 pb-1.5">
        {items.map((item) => {
          const active = isSameSelection(selection, item.selection)
          return (
            <li key={`${item.selection.kind}-${item.label}`}>
              <button
                type="button"
                onClick={() => onSelect(active ? null : item.selection)}
                aria-pressed={active}
                className={`flex w-full items-baseline gap-2.5 rounded px-2 py-1 text-left transition-colors ${
                  active
                    ? 'bg-accent-bright/10'
                    : selection !== null
                      ? 'opacity-45 hover:bg-white/4 hover:opacity-80'
                      : 'hover:bg-white/4'
                }`}
              >
                <span
                  className={`mt-1.5 w-5 shrink-0 ${item.swatchClass} ${active ? 'h-1' : 'h-0.5'}`}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block font-mono text-xs ${active ? 'text-ink' : 'text-ink-dim'}`}
                  >
                    {item.label}
                  </span>
                  <span className="block text-[0.7rem] leading-snug text-ink-faint">
                    {item.hint}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Repères de lecture : ce que le graphe encode et qu'aucune courbe ne dit. */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 border-t border-white/6 px-4 py-2 text-[0.7rem] leading-snug">
        <dt className="font-mono text-accent-bright">Dôme</dt>
        <dd className="text-ink-faint">Volume réellement couvert par le radar (portée × plafond)</dd>

        <dt className="font-mono text-warning">Cône ↑</dt>
        <dd className="text-ink-faint">
          Angle mort au-dessus de l'antenne : le faisceau ne monte pas plus haut
        </dd>

        <dt className="font-mono text-alert">Rouge</dt>
        <dd className="text-ink-faint">Portion de vol vue par un radar — acquisition puis perte</dd>

        <dt className="font-mono text-warning">T+</dt>
        <dd className="text-ink-faint">
          Marques toutes les 20 s : serrées = la fusée ralentit, écartées = elle accélère
        </dd>
      </dl>
    </div>
  )
}
