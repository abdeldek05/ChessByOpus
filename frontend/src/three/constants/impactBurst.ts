// Réglages de l'ÉCLAT D'IMPACT au sol (crash de la Mesange) : flash lumineux,
// nappe de poussière qui s'étale et colonne de fumée qui s'élève. Purement
// visuel, piloté par le temps écoulé depuis l'impact.

/** Flash : intensité de départ et durée d'extinction (s). */
export const FLASH_INTENSITY = 260
export const FLASH_DURATION = 0.55
export const FLASH_COLOR = '#ffb45a'

/** Poussière au sol : nombre de bouffées, expansion, durée de vie (s). */
export const DUST_COUNT = 16
export const DUST_RADIUS = 10
export const DUST_SIZE_START = 1.6
export const DUST_SIZE_END = 7.5
export const DUST_LIFE = 3.8
export const DUST_COLOR = '#b9a98e'

/** Colonne de fumée : bouffées qui montent lentement au-dessus de l'impact. */
export const SMOKE_COLUMN_COUNT = 12
export const SMOKE_RISE_SPEED = 2.6
export const SMOKE_COLUMN_LIFE = 5.5
export const SMOKE_SIZE_START = 2
export const SMOKE_SIZE_END = 8
export const SMOKE_COLUMN_COLOR = '#4a443c'
