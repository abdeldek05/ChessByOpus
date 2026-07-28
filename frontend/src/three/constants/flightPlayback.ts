// Paramètres du rejeu visuel de la trajectoire RocketPy. La physique (détection)
// garde les mètres et secondes réels ; la scène, elle, est NORMALISÉE PAR
// SCÉNARIO — l'échelle vient de `computeSceneScale` (voir lib/sceneScale.ts) et
// circule sous le nom `metersPerSceneUnit`. Seul le TEMPS est accéléré ici, pour
// le confort de visionnage.

/**
 * Le vrai vol dure 100-200 s : trop long. On le rejoue en ACCÉLÉRÉ mais en
 * gardant le TEMPS RÉEL de RocketPy (donc la gravité : montée qui décélère,
 * chute qui accélère). `TIME_SCALE` = nombre de secondes de vol réel jouées par
 * seconde d'animation. 10 → un vol de 160 s dure 16 s à l'écran.
 *
 * ABAISSÉ (5 → 3) pour tuer le « gros bonds » : à TIME_SCALE=5, chaque frame
 * avançait ~0.08 s de vol réel, soit ~25 m à 300 m/s en ascension — un pas
 * spatial assez grand pour se lire comme un SAUT entre deux frames affichées.
 * À 3, c'est ~15 m/frame : le déplacement inter-frame redevient continu à
 * l'œil. Le vol dure un peu plus longtemps à l'écran, compromis assumé pour
 * la fluidité (la position reste interpolée par le temps, gravité préservée).
 */
export const TIME_SCALE = 3

/**
 * Ralenti du DÉCOLLAGE : les premières secondes de vol réel sont jouées plus
 * lentement (on voit bien la fusée quitter la rampe) puis on rejoint `TIME_SCALE`.
 * `LIFTOFF_REAL_SEC` = fenêtre de vol réel concernée ; `LIFTOFF_TIME_SCALE` = son
 * facteur d'accélération (plus petit = plus lent).
 */
export const LIFTOFF_REAL_SEC = 4
export const LIFTOFF_TIME_SCALE = 2.5

/**
 * Agrandissement de la fusée en vol, appliqué à la taille BRUTE du modèle
 * (~5.62 unités) — pas à l'échelle de la trajectoire.
 *
 * EXAGÉRATION DE LISIBILITÉ ASSUMÉE, mesurée : à l'échelle exacte de sa
 * trajectoire, une Mesange de 4.5 m ferait 1 à 8 PIXELS sur un écran 1080p selon
 * le scénario — invisible. La fusée rendue est donc 45 à 140× trop grosse par
 * rapport à sa trajectoire, et ce facteur VARIE avec le scénario (il dépend de
 * `metersPerSceneUnit`).
 *
 * Ce n'est pas corrigeable en normalisant la fusée : tout le pas de tir (mât
 * 6.3 u, dalle 13×10 u, blocs béton — voir launcherRig.ts) est calibré à la main
 * sur ces 5.62 unités. Normaliser la fusée seule la réduirait à ~3 % de la
 * hauteur du mât ; normaliser le rig entier rendrait le décor invisible. C'est
 * pourquoi l'altitude est lue sur un CHIFFRE (voir KingAltitudeTag) et non
 * estimée à l'œil en comparant à la fusée — cette dernière ne peut pas servir
 * de référence d'échelle.
 *
 * RÉDUIT (3.2 → 2.4 → 1.2). Mesure de la taille à l'écran (hauteur, FOV 55°) qui
 * a motivé la dernière baisse — le facteur avait été calibré pour le cas
 * LOINTAIN alors que le mode par défaut est le cas PROCHE :
 *
 *   distance caméra   ×2.4        ×1.2
 *   24 u (suivi)      54 %  →     27 %   ← le mode par défaut : elle bouchait la vue
 *   150 u             8.6 % →     4.3 %
 *   3200 u (radar)    0.4 % →     0.2 %
 *
 * Une taille FIXE en unités ne peut pas satisfaire les deux bouts (la caméra va
 * de 24 à 4665 u, facteur 194). On privilégie donc le mode SUIVI, le seul où l'on
 * regarde la fusée elle-même : en vue radar/large c'est le théâtre qu'on lit, et
 * le CORRIDOR y reste parfaitement visible puisque son épaisseur est exprimée en
 * pixels écran (voir visibilityCorridor.ts) — la trace ne dépend pas de la
 * taille du modèle.
 */
export const FLYING_ROCKET_SCALE = 1.2

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
