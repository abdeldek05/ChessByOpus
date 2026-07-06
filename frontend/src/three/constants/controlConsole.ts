// Petit poste de commande au sol (« ordinateur ») posé sur la dalle, à côté du
// banc de tir : caisson, écran inclinable et clavier. L'écran affiche un bouton
// LANCER cliquable. Toutes les dimensions sont en unités de scène.

// Emplacement du poste, relatif à LAUNCH_CENTER (posé sur la dalle, avant-droit).
export const CONSOLE_POSITION: [number, number, number] = [4.6, 0, 3.4]
// Orientation : tourné vers le banc de tir/la caméra.
export const CONSOLE_ROTATION_Y = -0.5

// Caisson (unité centrale) sur pieds.
export const CABINET = { width: 1.5, height: 0.95, depth: 0.85, legHeight: 0.12 }

// Écran incliné sur le caisson.
export const SCREEN = {
  width: 1.28,
  height: 0.82,
  depth: 0.06,
  tiltRad: -0.32,
  bezel: 0.05,
}

// Clavier plat devant le caisson.
export const KEYBOARD = { width: 0.9, height: 0.04, depth: 0.34 }

export const CONSOLE_COLORS = {
  cabinet: '#20262e',
  cabinetEdge: '#2e3742',
  leg: '#12161b',
  screenBezel: '#0a0d12',
  keyboard: '#1a1f26',
  key: '#2a323c',
  // Écran allumé : lueur froide type terminal, assez vive pour bien rayonner.
  screenGlow: '#164a68',
  screenText: '#9be8ff',
}

// Bouton LANCER affiché sur l'écran (armé vs verrouillé).
export const LAUNCH_BUTTON = {
  armedColor: '#2bd47a',
  armedEmissive: '#0f7a44',
  hoverEmissive: '#1fd07a',
  lockedColor: '#3a4048',
  lockedEmissive: '#000000',
  pressDepth: 0.02,
}
