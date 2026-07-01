/**
 * `useMesangeScene` centre le modèle sur les 3 axes (adapté à l'aperçu
 * flottant du Hero), donc la moitié de la fusée passe sous y=0 une fois
 * posée au sol. Décalage = moitié du plus grand axe du modèle brut
 * (~5.62 unités, mesuré sur mesange_hq.glb), pour que la base touche le sol
 * dans la scène de lancement.
 */
export const MESANGE_GROUND_LIFT = 2.81
