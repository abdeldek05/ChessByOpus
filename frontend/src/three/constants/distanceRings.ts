// Anneaux de distance au sol, centrés sur le pas de tir : la « preuve métrée »
// de la scène de lancement. À l'échelle FIXE 1:200 (cf. computeRadarSceneOffset),
// ils matérialisent la vraie distance radar↔pas de tir. Esprit simu d'exo : le
// sol est gradué, l'opérateur LIT la distance directement dans la scène.

// Paliers de distance (km) tracés au sol. Couvrent la plage utile (≤ 80 km) ;
// les paliers au-delà du radar sont simplement ignorés au rendu.
export const RING_STEPS_KM = [10, 20, 40, 60, 80] as const

// Laiton lumineux discret (miroir du HUD), lisible sur le sol nuit sans écraser
// la base. Le dernier anneau visible est légèrement accentué.
export const RING_COLOR = '#94866e'
export const RING_LABEL_COLOR = '#cdbb98'

// Épaisseur du trait d'anneau (unités de scène) et taille du texte des labels.
export const RING_LINE_WIDTH = 1.4
export const RING_LABEL_SIZE = 7
