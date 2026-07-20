// Corridor de visibilité (calque live) : la trajectoire RÉELLEMENT volée,
// tracée en direct (voir useVisibilityCorridorTrail), colorée selon quel radar
// voit la fusée à cet instant — vert = radar principal, ambre = second radar,
// rouge = trou (aucun radar). Couleurs « néon » : canaux volontairement
// au-dessus de 1.0 — la ligne n'est PAS tone-mappée (LineMaterial, shader
// dédié aux fat lines) donc ces valeurs HDR sont écrites telles quelles dans
// le buffer et captées par le Bloom du pipeline (PostFX) → halo lumineux,
// sans shader dédié à écrire.

/** Épaisseur du corridor (pixels écran, fat line via LineMaterial). */
export const CORRIDOR_LINE_WIDTH = 5

/** Couleurs "vu par un radar" (une par radar posé, 1er/2e). */
export const CORRIDOR_SEEN_COLORS: readonly (readonly [number, number, number])[] = [
  [0.2, 2.8, 0.7], // vert néon
  [2.6, 1.2, 0.15], // ambre néon
]

/** Couleur des segments hors de toute couverture radar (trou). */
export const CORRIDOR_BLIND_COLOR: readonly [number, number, number] = [2.6, 0.15, 0.35] // rouge néon
