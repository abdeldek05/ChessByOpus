/** Courbe sélectionnée dans le graphe de profil de couverture (voir
 *  TrajectoryPlotScene). `null` = aucune sélection, tout est au repos.
 *
 *  - `king`     : la trajectoire de la menace réelle (trace cyan) ;
 *  - `radar`    : les portions VUES par un radar donné (segments rouges) ;
 *  - `decoy`    : la trajectoire d'un leurre (Dame/Pion), identifiée par son id.
 */
export type ProfileSelection =
  | { kind: 'king' }
  | { kind: 'radar'; radarId: string }
  | { kind: 'decoy'; decoyId: string }
  | null

/** Deux sélections désignent-elles la même courbe ? (comparaison structurelle —
 *  les objets sont recréés à chaque clic, donc `===` ne suffit pas). */
export function isSameSelection(a: ProfileSelection, b: ProfileSelection): boolean {
  if (a === null || b === null) return a === b
  if (a.kind !== b.kind) return false
  if (a.kind === 'radar' && b.kind === 'radar') return a.radarId === b.radarId
  if (a.kind === 'decoy' && b.kind === 'decoy') return a.decoyId === b.decoyId
  return true // deux 'king'
}
