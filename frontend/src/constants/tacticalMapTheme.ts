import type { MesangeRole } from '@/types/mission.types'

// Thème PARTAGÉ des 3 cartes MapLibre "radar" (placement, azimut/menace,
// tactique en vol) — SOURCE UNIQUE : avant ce fichier, chacune des 3 cartes
// redéfinissait sa propre COVERAGE_COLOR/ALERT_COLOR (même valeur par
// copier-coller, aucun lien réel entre elles), et le dasharray de couverture
// comme le "rouge d'alerte" avaient déjà divergé sans que personne s'en
// aperçoive (`#e0584f` vs `#e0533a`). Toute couleur/style qui doit rester
// IDENTIQUE d'une carte à l'autre vit ici ; les 3 fichiers `*Map.ts`
// importent depuis ce module et ne redéfinissent plus rien.
//
// Alignées sur les custom properties CSS de styles/index.css (MapLibre paint
// properties ne lisent pas les variables CSS, d'où la duplication figée ICI
// SEULEMENT — plus dans chaque carte individuellement).

/** Style de fond MapLibre — sombre, gratuit, sans clé d'accès. */
export const TACTICAL_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

/** Pitch (inclinaison caméra) commun aux 3 cartes — PLAT partout. Une des
 *  cartes était seule à 55° (vue 3D inclinée), rompant la continuité visuelle
 *  avec les 2 autres restées plates : décision tranchée en faveur du plat. */
export const TACTICAL_MAP_PITCH_DEG = 0

/** Laiton neutre : couverture radar, liaisons, marqueurs — même valeur que
 *  --color-radar / --color-accent (styles/index.css). */
export const COVERAGE_COLOR = '#94866e'

/** Rouge d'alerte — même valeur que --color-alert / --color-role-king
 *  (styles/index.css). SEULE source du rouge d'alerte : ne JAMAIS redéfinir
 *  une variante ailleurs (c'est exactement ce qui a produit `#e0533a`). */
export const ALERT_COLOR = '#e0584f'

/** Laiton clair : repère principal (portée max fusée, faisceau en recherche). */
export const ACCENT_BRIGHT_COLOR = '#cdbb98'

/** Pointillé du cercle de couverture radar — commun aux 3 cartes (une carte
 *  utilisait [4,4] au lieu de [3,3] partout ailleurs). */
export const COVERAGE_DASHARRAY: [number, number] = [3, 3]

/** Teinte de cône/piste par rôle CHESS — mêmes hex que --color-role-*
 *  (styles/index.css). Utilisée pour le cône d'azimut (carte Menace) ET pour
 *  la piste de vol tactique (carte Tactique) : c'est ce fil de couleur par
 *  rôle qui doit courir du placement jusqu'au vol, pas juste sur une étape. */
export const ROLE_COLOR: Record<MesangeRole, string> = {
  KING: ALERT_COLOR,
  QUEEN: ACCENT_BRIGHT_COLOR,
  PAWN: '#8a8d86',
}
