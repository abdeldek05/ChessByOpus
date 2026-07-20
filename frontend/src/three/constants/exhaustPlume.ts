// Réglages du panache d'échappement (flamme + fumée) rendu en particules sprites.
// Purement visuel : aucune donnée physique ici. Deux nuages de particules qui
// s'additionnent pour un volume continu, façon décollage filmé.

/** Nombre de particules de FLAMME (cœur brûlant, court, lumineux, additif). */
export const FLAME_COUNT = 30

/** Longueur du jet de flamme sous la fusée (unités scène). Façon CHALUMEAU :
 *  jet FIN et ALLONGÉ (pas large et diffus type lance-flamme). */
export const FLAME_LENGTH = 5
/** Largeur du jet de flamme — resserrée (chalumeau, pas lance-flamme). */
export const FLAME_WIDTH = 0.7
/** Vitesse d'éjection des particules de flamme : TRÈS RAPIDE au début (gaz
 *  sous pression), c'est ce qui donne l'impression de puissance. */
export const FLAME_SPEED = 42
/** Durée de vie d'une particule de flamme (s) : très courte → jet net et fin. */
export const FLAME_LIFE = 0.18

/** TRAÎNÉE de vapeur en MONTÉE (pas au sol) : fine, dans l'axe du jet, PAS un
 *  nuage qui entoure la fusée — s'étire derrière et se dissipe simplement. */
export const TRAIL_COUNT = 40
/** Dispersion latérale minime (jet fin, pas un cône qui s'évase). */
export const TRAIL_SPREAD = 0.4
/** Vitesse d'éjection vers l'arrière (le long de l'axe de poussée). */
export const TRAIL_SPEED = 7
/** Durée de vie d'une particule de traînée (s). */
export const TRAIL_LIFE = 1.4
/** Taille de départ / d'arrivée (grossit modérément, reste un filet). */
export const TRAIL_SIZE_START = 0.9
export const TRAIL_SIZE_END = 2.6

/** Couleurs : flamme façon CHALUMEAU (cœur bleu-blanc très chaud → bord blanc,
 *  pas orange large) ; fumée BLANCHE transparente (vapeur), pas grise/sale. */
export const FLAME_CORE_COLOR = '#eaf6ff'
export const FLAME_EDGE_COLOR = '#ffffff'
export const SMOKE_COLOR = '#f5f5f2'

/** Position verticale du panache (unités locales, sous la fusée) : sous la
 *  base du modèle en vol (elle-même à ~-3.4 après son propre pivot). */
export const EXHAUST_PLUME_Y = -3.4
