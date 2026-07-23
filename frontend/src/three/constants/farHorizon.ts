// Anneau de collines silhouette à l'horizon lointain — voir FarHorizon.tsx.
// Constantes de forme, séparées du composant pour rester lisibles.

/** Rayon (unités scène) où pose l'anneau de collines — bien avant le bord du
 *  sol plat (FAR_GROUND_RADIUS), pour rester visible avant que le fog l'ait
 *  totalement dissous. */
export const HORIZON_RING_RADIUS = 26000

/** Épaisseur radiale de la bande de collines (donne du volume à la silhouette
 *  plutôt qu'un mur plat vu de face). */
export const HORIZON_RING_THICKNESS = 3000

/** Hauteur max des « collines » (unités scène) — juste assez pour casser la
 *  ligne d'horizon plate, pas des montagnes. */
export const HORIZON_HILL_HEIGHT = 900

/** Nombre de segments autour de l'anneau : silhouette lointaine, un contour
 *  low-poly assumé suffit (jamais vu de près). */
export const HORIZON_SEGMENTS = 96

/** Nombre d'oscillations de hauteur sur le tour complet (donne le rythme des
 *  collines, pas une répétition trop régulière). */
export const HORIZON_HILL_FREQUENCY = 11
