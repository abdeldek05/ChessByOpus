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

/** Altitude de la couche (unités scène) — au niveau où le Roi/les leurres
 *  passent en montée, pour qu'ils la traversent visiblement. */
export const CLOUD_LAYER_ALTITUDE = 900

/** Épaisseur de la couche (unités scène) : le raymarching ne parcourt QUE
 *  cette tranche — borne dure du coût GPU. Fine = peu de steps suffisent. */
export const CLOUD_LAYER_THICKNESS = 320

/** Demi-côté du plan de nuages (unités scène) : assez large pour couvrir
 *  l'horizon visible depuis la zone de vol, sans dépasser le fog lointain. */
export const CLOUD_PLANE_HALF_SIZE = 9000

/** Nombre de pas de raymarching : PLAFOND DUR du coût par pixel. 24 suffit
 *  pour une couche fine et douce ; ne PAS monter sans re-tester le driver. */
export const CLOUD_RAYMARCH_STEPS = 24

/** Couverture (0-1) : seuil de densité — haut = ciel plus dégagé (quelques
 *  nuages épars), bas = couche plus continue. */
export const CLOUD_COVERAGE = 0.5

/** Densité optique : opacité accumulée par unité de nuage traversée. */
export const CLOUD_DENSITY = 0.9

/** Vitesse de dérive de la couche (unités bruit / s) — lente, vent d'altitude. */
export const CLOUD_DRIFT_SPEED = 0.01
