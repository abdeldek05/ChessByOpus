// Éléments fixes de la scène de lancement (couleurs THREE du pas de tir,
// distances de brume par défaut). Le ciel/sol et la lumière dépendent de
// l'ambiance jour/nuit, voir launchAmbiance.ts.
export const LAUNCH_PAD_COLOR = '#2c2e2b'
export const LAUNCH_PAD_RING_COLOR = '#6f6450'
export const LAUNCH_PAD_HEIGHT = 0.3

// La brume masque le bord de la plaine ; recalculée selon l'étalement de la
// scène dans LaunchSceneCanvas, ces valeurs servent de repli.
export const LAUNCH_FOG_NEAR = 45
export const LAUNCH_FOG_FAR = 230
