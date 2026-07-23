import { ACCENT_BRIGHT_COLOR, ALERT_COLOR } from '@/constants/tacticalMapTheme'

// Faisceau radar tournant de la carte tactique (vue PPI de dessus) : un secteur
// étroit qui balaie en continu autour de chaque radar rotatif, à la vitesse
// rotationRpm de sa config. Vire à l'alarme quand il accroche la menace.

/** Demi-largeur angulaire (deg) du secteur de balayage : le faisceau couvre
 *  [heading - half, heading + half]. ~24° de large au total = lecture claire
 *  du « coup de balai » sans masquer toute la zone. */
export const SWEEP_HALF_WIDTH_DEG = 12

/** Longueur (deg) de la traîne estompée derrière le faisceau, pour lire le sens
 *  de rotation (comme la rémanence d'un écran radar PPI). */
export const SWEEP_TRAIL_DEG = 70

/** Sens de rotation : +1 = horaire (cap croissant), -1 = anti-horaire. */
export const SWEEP_DIRECTION = 1

/** Vitesse de rotation (tr/min) utilisée si un radar n'a pas de rotationRpm. */
export const SWEEP_DEFAULT_RPM = 40

/** Couleurs du faisceau : recherche (laiton neutre) vs accrochage (alarme
 *  rouge) — SOURCE UNIQUE tacticalMapTheme.ts, alignées sur TRACK_LOCKED_COLOR
 *  de launchTacticalMap (avant : `#e0533a`, une variante proche mais PAS
 *  identique à ALERT_COLOR `#e0584f`, jamais remarquée à l'œil). */
export const SWEEP_SEARCH_COLOR = ACCENT_BRIGHT_COLOR
export const SWEEP_LOCKED_COLOR = ALERT_COLOR
