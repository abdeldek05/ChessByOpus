// Réglages de la DESTRUCTION de la Mesange à l'impact : fragments physiques
// éjectés en éventail, qui retombent sous gravité, REBONDISSENT au sol avec
// perte d'énergie et s'immobilisent. Braises incandescentes sur une partie des
// fragments. Purement visuel.

/** Nombre de fragments (mélange de tôles/tronçons). */
export const DEBRIS_COUNT = 26

/** Gravité scène (unités/s²) — chute rapide et lourde, échelle du crash. */
export const DEBRIS_GRAVITY = 34

/** Vitesse d'éjection initiale (min/max, unités/s) et biais vertical. */
export const DEBRIS_SPEED_MIN = 7
export const DEBRIS_SPEED_MAX = 20
export const DEBRIS_UP_BIAS = 0.55

/** Rebond au sol : restitution verticale et friction horizontale par rebond. */
export const DEBRIS_RESTITUTION = 0.34
export const DEBRIS_FRICTION = 0.72

/** Amortissement linéaire en l'air (traînée, par seconde). */
export const DEBRIS_AIR_DRAG = 0.12

/** Vitesse (unités/s) sous laquelle un fragment posé s'immobilise. */
export const DEBRIS_SETTLE_SPEED = 0.5

/** Rotation propre max (rad/s) — ralentit à chaque rebond. */
export const DEBRIS_SPIN_MAX = 10

/** Tailles des fragments (min/max, unités). */
export const DEBRIS_SIZE_MIN = 0.35
export const DEBRIS_SIZE_MAX = 1.5

/** Teintes des fragments : livrée fusée + tôles brûlées. */
export const DEBRIS_COLORS = ['#d8d5cf', '#a9a6a0', '#6e6a64', '#3a3632', '#221f1c'] as const

/** Braises : fraction des fragments incandescents et durée d'extinction (s). */
export const EMBER_FRACTION = 0.35
export const EMBER_FADE_SEC = 3
export const EMBER_COLOR = '#ff6a1f'

/** Graine du générateur (fragments reproductibles entre rejeux). */
export const DEBRIS_SEED = 1337
