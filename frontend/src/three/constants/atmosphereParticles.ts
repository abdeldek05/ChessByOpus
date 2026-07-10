// Particules atmosphériques (poussière / pollen) flottant dans l'air en golden
// hour : elles accrochent la lumière rasante et donnent de la vie à l'air, à la
// manière de Leap For Mankind. Volume centré sur le pas de tir, basse altitude.

// Nombre de particules et volume (unités) : large au sol, peu haut (l'air près
// du terrain, pas jusqu'au ciel).
export const PARTICLE_COUNT = 320
export const PARTICLE_VOLUME: [number, number, number] = [220, 26, 220]
// Hauteur du centre du volume au-dessus du sol (les particules flottent bas).
export const PARTICLE_CENTER_Y = 12

// Aspect : taille des grains, dérive lente, léger scintillement, teinte dorée.
export const PARTICLE_SIZE = 2.4
export const PARTICLE_SPEED = 0.25
export const PARTICLE_OPACITY = 0.5
export const PARTICLE_NOISE = 1.1
export const PARTICLE_COLOR = '#f0dcb0'
