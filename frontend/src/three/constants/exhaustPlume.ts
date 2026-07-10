// Réglages du panache d'échappement (flamme + fumée) rendu en particules sprites.
// Purement visuel : aucune donnée physique ici. Deux nuages de particules qui
// s'additionnent pour un volume continu, façon décollage filmé.

/** Nombre de particules de FLAMME (cœur brûlant, court, lumineux, additif). */
export const FLAME_COUNT = 26
/** Nombre de particules de FUMÉE (panache large, opaque, qui retombe au sol). */
export const SMOKE_COUNT = 60

/** Longueur du jet de flamme sous la fusée (unités scène). */
export const FLAME_LENGTH = 6
/** Largeur du jet de flamme. */
export const FLAME_WIDTH = 1.6
/** Vitesse d'éjection des particules de flamme (descendent puis meurent vite). */
export const FLAME_SPEED = 26
/** Durée de vie d'une particule de flamme (s) : très courte → jet net. */
export const FLAME_LIFE = 0.28

/** Étalement horizontal de la fumée au sol (rayon, unités scène). */
export const SMOKE_SPREAD = 10
/** Vitesse initiale d'expansion de la fumée. */
export const SMOKE_SPEED = 9
/** Durée de vie d'une particule de fumée (s) : longue → le panache persiste. */
export const SMOKE_LIFE = 2.6
/** Taille de départ / d'arrivée d'une bouffée de fumée (grossit en vieillissant). */
export const SMOKE_SIZE_START = 2.2
export const SMOKE_SIZE_END = 9

/** Couleurs (dégradé cœur → bord de flamme, et fumée claire salie). */
export const FLAME_CORE_COLOR = '#fff1c0'
export const FLAME_EDGE_COLOR = '#ff5a1a'
export const SMOKE_COLOR = '#cfc8ba'
