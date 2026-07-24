// Bande de brume atmosphérique à l'horizon (voir HorizonHaze.tsx) : une coque
// cylindrique semi-transparente, PAS des sprites nuages — remplace l'approche
// billboard (drei <Cloud>, jugée trop enfantine) par une nappe de vapeur
// diffuse qui avale la ligne de coupure du sol lointain.

/** Rayon (unités scène) de la coque — juste devant l'anneau de collines
 *  silhouette (voir farHorizon.ts), pour qu'elle mange la jonction sol/collines. */
export const HAZE_RADIUS = 22000

/** Hauteur totale de la coque (unités scène) : dense en bas, transparente en
 *  haut — voir le dégradé vertical dans useHorizonHazeMaterial. */
export const HAZE_HEIGHT = 3200

/** Élévation du bas de la coque par rapport au sol (0 = pile au niveau du
 *  pas de tir) — légèrement enfoncée pour masquer la jonction avec le sol
 *  plat sans laisser de liseré net en dessous. */
export const HAZE_BASE_Y = -200

/** Segments radiaux de la coque : assez pour un contour lisse vu de loin,
 *  jamais vue de près (comme FarHorizon). */
export const HAZE_SEGMENTS = 128

/** Densité globale (0-1) RÉDUITE (0.85 → 0.4) : la brume reste une nappe
 *  DISCRÈTE au tout-lointain (bout du monde), plus un voile épais qui
 *  participait au « filtre » sur l'air. */
export const HAZE_DENSITY = 0.4

/** Vitesse de dérive du bruit (unités bruit / seconde) — très lente, pour une
 *  ondulation organique perceptible sur de longs vols sans jamais « tourner ». */
export const HAZE_DRIFT_SPEED = 0.006

/** Échelle du bruit (plus petit = motifs plus larges). */
export const HAZE_NOISE_SCALE = 3.5

/** Teinte vers laquelle la brume se réchauffe côté soleil (golden hour) —
 *  voir useHorizonHazeMaterial. DÉSATURÉE (avant `#ffb877`, un orange vif qui
 *  participait au voile orange sale) : à peine plus chaude que le fog neutre,
 *  juste un soupçon de golden hour, plus une dominante orange sur tout l'air. */
export const HAZE_SUN_TINT = '#e8d3b0'
