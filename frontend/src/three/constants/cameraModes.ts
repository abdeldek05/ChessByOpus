// Réglages des modes de caméra pendant le vol (voir CameraMode, LaunchCameraControls).
// Les modes 'radar' et 'wide' posent la caméra à une position calculée et la
// pointent (lookAt) — logique dans useRadarViewCamera / useWideCamera.

/** Vue CÔTÉ RADAR : hauteur (unités scène) au-dessus du radar d'où l'on regarde
 *  les fusées — un peu au-dessus de l'antenne pour dominer la scène sans être au
 *  ras du sol. Recul léger derrière le radar (fraction de sa distance au pad)
 *  pour cadrer à la fois le radar et le pas de tir dans le champ. */
export const RADAR_VIEW_HEIGHT = 22
export const RADAR_VIEW_PULLBACK_FACTOR = 0.12

/** Lissage du regard (lookAt) de la vue radar vers la fusée : indépendant du
 *  framerate via 1-exp(-k·dt). Assez vif pour suivre, assez doux pour ne pas
 *  saccader sur les petits mouvements. */
export const RADAR_VIEW_LOOK_STIFFNESS = 6

/** VUE LARGE FIXE : recul (multiplicateur du rayon à cadrer) et hauteur
 *  (idem) de la caméra par rapport au centre pad↔radars. Cadre tout le théâtre
 *  d'opérations en permanence, immobile. */
export const WIDE_VIEW_DISTANCE_FACTOR = 1.35
export const WIDE_VIEW_HEIGHT_FACTOR = 0.55
/** Point visé par la vue large : un peu au-dessus du sol pour laisser respirer
 *  le ciel où montent les fusées (fraction du rayon cadré). */
export const WIDE_VIEW_LOOK_HEIGHT_FACTOR = 0.25
