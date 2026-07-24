// Anneau de collines silhouette à l'horizon lointain — voir FarHorizon.tsx.
// Constantes de forme, séparées du composant pour rester lisibles.

/** Rayon (unités scène) où pose l'anneau de collines — bien avant le bord du
 *  sol plat (FAR_GROUND_RADIUS), pour rester visible avant que le fog l'ait
 *  totalement dissous. */
export const HORIZON_RING_RADIUS = 26000

/** Épaisseur radiale de la bande de collines (donne du volume à la silhouette
 *  plutôt qu'un mur plat vu de face). */
export const HORIZON_RING_THICKNESS = 3000

/** Hauteur max des « collines » (unités scène) RELEVÉE (900 → 1500) : un vrai
 *  relief de montagnes lointaines à l'horizon, plus marqué qu'une simple
 *  ondulation, pour un « bout du monde » habité (paysage moins vide). */
export const HORIZON_HILL_HEIGHT = 1500

/** Nombre de segments autour de l'anneau — relevé (96 → 160) pour porter les
 *  crêtes plus variées (3 fréquences, voir hillHeight) sans facettes grossières. */
export const HORIZON_SEGMENTS = 160

/** Nombre d'oscillations de hauteur sur le tour complet (donne le rythme des
 *  collines, pas une répétition trop régulière). */
export const HORIZON_HILL_FREQUENCY = 11
