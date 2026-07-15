// Config statique de la carte tactique de l'écran de lancement (couleurs HUD,
// paliers de distance). Pas de logique ici — juste des valeurs partagées entre
// le hook et son rendu.

// Style de fond sombre gratuit, sans clé d'accès (même que les cartes mission).
export const TACTICAL_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

// Laiton du HUD. Couverture/liaison en laiton mat, cône de menace en laiton
// clair. Épuré : pas de faisceau tournant (radars statiques).
export const COVERAGE_COLOR = '#94866e'
export const THREAT_CONE_COLOR = '#cdbb98'
export const RING_COLOR = '#4a5340'

// Paliers de distance (km) tracés autour du pas de tir, épurés (peu de repères
// pour ne pas charger). Ceux qui dépassent la portée max sont ignorés.
export const RING_STEPS_KM = [25, 50, 100] as const

// Piste de la menace sur la carte (vue radar). TRACK_GHOST : portion NON encore
// détectée (angle mort) — discret, pointillé. TRACK_LOCKED : portion accrochée
// par un radar — alarme rouge, piste confirmée. TRACK_HEAD : point de position
// actuelle de la menace. (La distinction ghost/locked est branchée à l'étape 2.)
export const TRACK_COLOR = '#c8ccd0' // trace neutre (étape 1, avant détection)
export const TRACK_GHOST_COLOR = '#8790a0'
export const TRACK_LOCKED_COLOR = '#e0533a'
export const TRACK_HEAD_COLOR = '#ffffff'
