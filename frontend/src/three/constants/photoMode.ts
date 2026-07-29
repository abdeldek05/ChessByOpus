// MODE PHOTO — réglages de rendu poussés pour faire des CAPTURES d'écran, pas
// pour l'usage courant. Tout ce qui est ici sacrifie les FPS au profit de
// l'image : densité de gazon, résolution d'ombres, textures, échantillonnage
// des effets. Éteint, le fichier n'a aucun effet sur la scène normale.
//
// ⚠️ Ne PAS laisser à `true` : la scène tourne déjà à ~30 FPS en qualité
// normale (voir PERF_HUD_ENABLED pour mesurer). En mode photo elle descendra
// nettement plus bas — c'est attendu, on fige l'image pour la capturer.

/** Active le mode photo. Passer à `true` le temps des captures, puis remettre `false`. */
export const PHOTO_MODE = false

// --- Densité et détail du décor ---------------------------------------------

/** Multiplicateur de densité du gazon (touffes par unité²). ×3 = prairie dense
 *  qui remplit vraiment le cadre au sol, au lieu d'une herbe clairsemée. */
export const PHOTO_GRASS_DENSITY_FACTOR = 3

/** Multiplicateur du rayon de streaming du gazon. Volontairement MODESTE (1.2) :
 *  le nombre de tuiles vivantes croît en RADIUS², donc ce facteur coûte bien plus
 *  cher que la densité — à 1.6 on passait à ~315 000 touffes (×7.7), au-delà du
 *  pic de triangles qui a déjà fait tomber le pilote AMD sur ce projet. À 1.2 le
 *  gazon reste dense dans tout le cadre utile sans ce risque. */
export const PHOTO_GRASS_RADIUS_FACTOR = 1.2

/** Multiplicateur du plafond d'instances par tuile — sans lui, la densité
 *  ci-dessus serait écrêtée par GRASS_MAX_PER_TILE et n'aurait aucun effet. */
export const PHOTO_GRASS_MAX_FACTOR = 4

// --- Ombres ------------------------------------------------------------------

/** Résolution de la shadow map en mode photo (contre 2048 en normal) : les
 *  ombres sont figées (voir FreezeShadows), le coût n'est donc payé qu'au
 *  re-cuit — 4096² donne des contours nets sur les gradins du pad et les brins. */
export const PHOTO_SHADOW_MAP_SIZE = 4096

// --- Résolution de rendu ------------------------------------------------------

/** Plafond de device pixel ratio. 2 = rendu à 4× les pixels d'un écran 1×, ce
 *  qui supprime l'escalier sur les arêtes fines (rampe, mâts, brins d'herbe). */
export const PHOTO_DPR_MAX = 2

// --- Effets ------------------------------------------------------------------

/** Qualité de l'occlusion ambiante (contre 'performance' en normal) : les
 *  contacts sol/objet et les creux du béton se creusent vraiment. */
export const PHOTO_AO_QUALITY = 'high' as const

/** Échantillons des god rays (contre 30) : rayons crépusculaires lisses, sans
 *  le banding en escalier qui trahit un faible échantillonnage. */
export const PHOTO_GOD_RAYS_SAMPLES = 60

/** Pas de raymarching des nuages volumétriques (contre 12) : silhouettes de
 *  cumulus franches au lieu d'un fondu mou. */
export const PHOTO_CLOUD_STEPS = 32

// --- Matériaux ----------------------------------------------------------------

/** Résolution des textures procédurales (béton du pad, gazon) — contre 512 en
 *  normal. Le grain, les joints de dilatation et les traces d'usure deviennent
 *  lisibles en gros plan au lieu de baver. */
export const PHOTO_TEXTURE_SIZE = 2048

/** Intensité des reflets d'environnement sur les surfaces métalliques du pad
 *  (rails, mâts, tuyauterie) : inox qui accroche vraiment la lumière du soleil
 *  et le ciel, au lieu d'un gris mat. */
export const PHOTO_METAL_ENV_INTENSITY = 2.4

/** Rugosité des métaux du pas de tir en mode photo : plus bas = plus poli, donc
 *  reflets nets. Reste au-dessus de 0 — un métal parfaitement lisse fait
 *  plastique, l'inox réel garde un fin brossage. */
export const PHOTO_METAL_ROUGHNESS = 0.22
