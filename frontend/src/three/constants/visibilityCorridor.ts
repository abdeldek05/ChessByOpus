// Corridor de visibilité (calque live) : la trajectoire RÉELLEMENT volée,
// tracée en direct (voir useVisibilityCorridorTrail), colorée selon quel radar
// voit la fusée à cet instant — vert = radar principal, ambre = second radar,
// rouge = trou (aucun radar). Couleurs « néon » : canaux volontairement
// au-dessus de 1.0 — la ligne n'est PAS tone-mappée (LineMaterial, shader
// dédié aux fat lines) donc ces valeurs HDR sont écrites telles quelles dans
// le buffer et captées par le Bloom du pipeline (PostFX) → halo lumineux,
// sans shader dédié à écrire.

/** Épaisseur du corridor du ROI (pixels écran, fat line via LineMaterial). */
export const CORRIDOR_LINE_WIDTH = 5

/** Épaisseur du corridor d'un LEURRE (Dame/Pion) : bien plus fin que le Roi —
 *  la menace réelle reste visuellement prioritaire, et en essaim (plusieurs
 *  pions) des traits fins évitent de saturer l'image. */
export const CORRIDOR_DECOY_LINE_WIDTH = 1.5

/** Espacement minimal (unités scène) entre points accumulés du corridor d'un
 *  LEURRE : PLUS GRAND que le Roi → moins de sommets par corridor. En essaim
 *  (N pions × un corridor chacun), c'est le nombre TOTAL de sommets rebuild à
 *  chaque publication qui plombe le FPS — espacer les points le divise. */
export const CORRIDOR_DECOY_MIN_SPACING = 2.5

/** Plafond de points d'un corridor de LEURRE : bien plus bas que le Roi
 *  (garde-fou essaim — borne le coût géométrie cumulé). Atteindre ce plafond
 *  DÉCIME le corridor (1 point sur 2, voir useCorridorPoints) au lieu de cesser
 *  d'accumuler : la trajectoire reste complète de bout en bout, seule sa
 *  résolution baisse. Cesser d'accumuler gelait la ligne vers l'apogée. */
export const CORRIDOR_DECOY_MAX_POINTS = 500

/** Cadence de publication (s) du corridor d'un LEURRE : plus lente que le Roi
 *  → moins de rebuild de géométrie <Line> par seconde, ×N pions. */
export const CORRIDOR_DECOY_PUBLISH_SEC = 0.35

/** Couleurs "vu par un radar" (une par radar posé, 1er/2e). */
export const CORRIDOR_SEEN_COLORS: readonly (readonly [number, number, number])[] = [
  [0.2, 2.8, 0.7], // vert néon
  [2.6, 1.2, 0.15], // ambre néon
]

/** Couleur des segments hors de toute couverture radar (trou). */
export const CORRIDOR_BLIND_COLOR: readonly [number, number, number] = [2.6, 0.15, 0.35] // rouge néon
