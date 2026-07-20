// Paramètres du rejeu visuel de la trajectoire RocketPy. La physique (détection)
// garde les mètres et secondes réels ; la scène partage désormais la MÊME
// échelle réelle (METERS_PER_SCENE_UNIT, voir sceneLayout.ts) — plus de
// normalisation par vol ici, seul le TEMPS reste accéléré pour le confort.

/**
 * Le vrai vol dure 100-200 s : trop long. On le rejoue en ACCÉLÉRÉ mais en
 * gardant le TEMPS RÉEL de RocketPy (donc la gravité : montée qui décélère,
 * chute qui accélère). `TIME_SCALE` = nombre de secondes de vol réel jouées par
 * seconde d'animation. 10 → un vol de 160 s dure 16 s à l'écran.
 */
export const TIME_SCALE = 5

/**
 * Ralenti du DÉCOLLAGE : les premières secondes de vol réel sont jouées plus
 * lentement (on voit bien la fusée quitter la rampe) puis on rejoint `TIME_SCALE`.
 * `LIFTOFF_REAL_SEC` = fenêtre de vol réel concernée ; `LIFTOFF_TIME_SCALE` = son
 * facteur d'accélération (plus petit = plus lent).
 */
export const LIFTOFF_REAL_SEC = 4
export const LIFTOFF_TIME_SCALE = 2.5

/**
 * Agrandissement de la fusée en vol : à l'échelle normalisée elle deviendrait un
 * point. On la grossit pour rester bien visible sans casser l'échelle au sol.
 */
export const FLYING_ROCKET_SCALE = 3.2

/**
 * Durée (s, temps de vol RÉEL non accéléré) sur laquelle l'échelle passe
 * progressivement de 1 (taille du modèle statique sur la rampe) à
 * FLYING_ROCKET_SCALE — un grossissement instantané dès le décollage donnait
 * l'impression que la fusée « apparaissait » d'un coup plus grosse au lieu de
 * s'éloigner naturellement.
 */
export const SCALE_TRANSITION_SEC = 6

/** Fin de poussée (s, temps de vol réel) : durée de burn de la Mesange V2. */
export const BURN_TIME_SEC = 35.7

/**
 * CHUTE PGRV (dès l'apogée) : la vraie descente RocketPy est une chute
 * quasi-balistique (pas de parachute modélisé, ~300+ m/s en fin de trajectoire)
 * freinée par une traînée aérodynamique qui dépend du Mach — trop complexe à
 * dupliquer fidèlement en JS pour un effet purement visuel. On bascule donc,
 * dès l'apogée, sur une intégration physique SIMPLE (gravité réelle + traînée
 * quadratique approximée par un coefficient constant) : garantit un ordre de
 * grandeur crédible (chute qui accélère puis se stabilise un peu) et un
 * impact TOUJOURS exact sur le relief 3D réel, indépendamment du sol plat que
 * RocketPy connaît. Le bilan physique affiché (détection radar) continue
 * d'utiliser les VRAIES données RocketPy — cette bascule est UNIQUEMENT
 * visuelle.
 */
export const GRAVITY_MS2 = 9.81
/** Coefficient de traînée quadratique approximatif (1/m), calé pour donner un
 *  ordre de grandeur de vitesse de chute réaliste (quelques centaines de m/s
 *  avant de ralentir sensiblement près du sol) sans reproduire la vraie
 *  courbe Cd(Mach) de RocketPy. */
export const FALL_DRAG_COEFF = 0.00045

/**
 * Secousse caméra au décollage (simule la poussée qui ébranle le sol/la
 * caméra proche) : amplitude max (unités scène) et durée (s, temps ANIMATION,
 * pas accéléré) de la décroissance. Un à-coup bref, pas un bruit permanent.
 */
export const LAUNCH_SHAKE_AMPLITUDE = 0.35
export const LAUNCH_SHAKE_DURATION_SEC = 0.9
/** Fréquence du tremblement (oscillations/s) — assez rapide pour lire "vibration". */
export const LAUNCH_SHAKE_FREQUENCY = 18
