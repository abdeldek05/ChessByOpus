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
      { selection: { kind: 'king' }, label: 'Threat', swatchClass: 'bg-accent-bright' },
    ]

    for (const rc of radarCuts) {
      if (rc.windows.length === 0) continue
      items.push({
        selection: { kind: 'radar', radarId: rc.id },
        label: `Seen — ${rc.name}`,
        swatchClass: 'bg-alert',
      })
    }

    for (const decoy of decoyTracks ?? []) {
      items.push({
        selection: { kind: 'decoy', decoyId: decoy.id },
        label: getMesangeRoleLabel(decoy.role),
        swatchClass: 'bg-role-pawn',
      })
    }

    return items
  }, [radarCuts, decoyTracks])
}
