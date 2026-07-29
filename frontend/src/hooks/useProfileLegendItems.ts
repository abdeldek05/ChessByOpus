import { useMemo } from 'react'
import { getMesangeRoleLabel } from '@/lib/getMesangeRoleLabel'
import type { ProfileLegendItem } from '@/components/sections/Lancement/CoverageProfileLegend'
import type { CoverageCut } from '@/hooks/useCoverageCut'
import type { DecoyTrack } from '@/lib/launchTacticalMap'

/**
 * Entrées de la légende du profil de couverture, dérivées du scénario réel :
 * la menace, une entrée par radar qui l'accroche, puis une par leurre. Les
 * pastilles reprennent les teintes des courbes du graphe 3D — chaque entrée
 * désigne donc sans ambiguïté la courbe qu'elle sélectionne.
 *
 * Seuls les radars ayant AU MOINS une fenêtre de visibilité sont listés : une
 * entrée « vu par radar 2 » alors que ce radar n'a jamais rien vu n'aurait aucune
 * courbe à illuminer, et laisserait croire à une détection.
 */
export function useProfileLegendItems(
  radarCuts: CoverageCut['radarCuts'],
  decoyTracks: DecoyTrack[] | undefined,
): ProfileLegendItem[] {
  return useMemo(() => {
    const items: ProfileLegendItem[] = [
      {
        selection: { kind: 'king' },
        label: 'Menace (Roi)',
        swatchClass: 'bg-accent-bright',
        hint: 'Trajectoire réelle à détecter — trace neutre tant qu’aucun radar ne la voit',
      },
    ]

    for (const rc of radarCuts) {
      if (rc.windows.length === 0) continue
      const windows = rc.windows.length
      items.push({
        selection: { kind: 'radar', radarId: rc.id },
        // La PORTÉE réglée est rappelée ici : c'est elle qui explique la taille du
        // dôme affiché, et on ne pouvait la lire nulle part sur le profil.
        label: `${rc.name} · ${Math.round(rc.rangeM / 1000)} km`,
        swatchClass: 'bg-alert',
        // Le NOMBRE de fenêtres dit tout de suite si le radar a suivi la menace
        // d'un bloc ou l'a perdue puis reprise — l'info que le graphe montre en
        // segments rouges séparés, mais qu'on ne compte pas à l'œil.
        hint:
          windows === 1
            ? 'Vue par ce radar sur une seule fenêtre continue'
            : `Vue par ce radar sur ${windows} fenêtres — perdue puis reprise`,
      })
    }

    for (const decoy of decoyTracks ?? []) {
      items.push({
        selection: { kind: 'decoy', decoyId: decoy.id },
        label: getMesangeRoleLabel(decoy.role),
        swatchClass: 'bg-role-pawn',
        hint: 'Leurre : occupe le radar sans être la vraie menace',
      })
    }

    return items
  }, [radarCuts, decoyTracks])
}
