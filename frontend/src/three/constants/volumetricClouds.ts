import { PHOTO_MODE, PHOTO_CLOUD_STEPS } from '@/three/constants/photoMode'

// Couche de nuages VOLUMÉTRIQUES à hauteur de vol (voir VolumetricClouds.tsx) :
// un grand plan horizontal rendu par un shader de raymarching COURT (densité
// fBm), placé au niveau où la fusée passe — vrais nuages 3D vus de dessous/
// dedans, pas des billboards plats. Bornée à une couche fine (pas un volume
// infini) pour rester dans le budget GPU AMD (voir feedback_gpu_budget :
// rendu maximal autorisé, mais JAMAIS le pic qui grille le driver).

/** GARDE-FOU : passe à false pour couper entièrement les nuages volumétriques
 *  si le driver montre le moindre signe de faiblesse (perte de contexte,
 *  écran noir). Un seul interrupteur, sans toucher au reste de la scène. */
export const VOLUMETRIC_CLOUDS_ENABLED = true

/** Altitude RÉELLE de la couche (m) — celle de vrais cumulus. Exprimée en
 *  mètres et non en unités de scène : une altitude fixée en unités DÉRIVE avec
 *  l'échelle du scénario (mesuré : 900 unités valaient 13.5 km avec un radar
 *  proche, 21.9 km sur un scénario type et 42.2 km avec un radar à 150 km — soit
 *  la stratosphère). En mètres, la couche est TOUJOURS à 2 km, donc la fusée la
 *  traverse toujours au même moment de sa montée (~9 % de l'ascension) et les
 *  nuages deviennent un jalon d'altitude crédible au lieu d'un décor flottant. */
export const CLOUD_LAYER_ALTITUDE_M = 2000

/** Épaisseur RÉELLE de la couche (m) : le raymarching ne parcourt QUE cette
 *  tranche — borne dure du coût GPU. Fine = peu de steps suffisent. */
export const CLOUD_LAYER_THICKNESS_M = 900

/** Demi-côté du plan de nuages (unités scène) : assez large pour couvrir
 *  l'horizon visible depuis la zone de vol, sans dépasser le fog lointain. */
export const CLOUD_PLANE_HALF_SIZE = 9000

/** Nombre de pas de raymarching : PLAFOND DUR du coût par pixel. ABAISSÉ
 *  (24 → 12, garde-fou 70 FPS) : le raymarching coûte N échantillons par pixel
 *  du plan de nuages (très large) — 12 pas suffisent pour une couche fine et
 *  douce et divisent ce coût par 2. Voir feedback_gpu_budget (priorité fluidité). */
// Le shader borne sa boucle à 64 itérations en dur : la valeur photo (32) reste
// donc sous le plafond, aucun GLSL à toucher.
export const CLOUD_RAYMARCH_STEPS = PHOTO_MODE ? PHOTO_CLOUD_STEPS : 12

/** Couverture (0-1) : seuil de densité — haut = ciel plus dégagé (quelques
 *  nuages épars), bas = couche plus continue. */
export const CLOUD_COVERAGE = 0.5

/** Densité optique : opacité accumulée par unité de nuage traversée. */
export const CLOUD_DENSITY = 0.9

/** Vitesse de dérive de la couche (unités bruit / s) — lente, vent d'altitude. */
export const CLOUD_DRIFT_SPEED = 0.01
