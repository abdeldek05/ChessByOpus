// Relief léger de la pelouse : ondulations douces obtenues en sommant
// quelques sinusoïdes (pas de vraie fonction de bruit, mais suffisant pour
// casser l'aspect « billard »). Un disque central reste plat pour asseoir le
// banc de tir, avec un anneau de transition pour un raccord invisible.

export interface ReliefWave {
  amplitude: number
  freqX: number
  freqZ: number
  phase: number
}

// Longueurs d'onde volontairement grandes (basses fréquences) : de larges
// bosses de terrain, pas des vaguelettes. Palier PRUDENT — relief doux présent,
// zone du pas de tir gardée plate (FLAT_RADIUS large), caméra non touchée.
export const RELIEF_WAVES: ReliefWave[] = [
  { amplitude: 3.0, freqX: 0.010, freqZ: 0.012, phase: 0.0 }, // larges ondulations
  { amplitude: 1.4, freqX: 0.024, freqZ: 0.020, phase: 1.7 }, // bosses moyennes
  { amplitude: 0.6, freqX: 0.052, freqZ: 0.058, phase: 3.4 }, // micro-bosses
]

// Nombre de subdivisions du plan de sol : allégé (moins de triangles) tout en
// gardant un relief lisse à ces basses fréquences. 96² = ~9k quads, largement
// suffisant pour ces ondulations douces.
export const RELIEF_SEGMENTS = 96

// Zone plate sous la plateforme (rayon) et fin de la transition vers le relief.
// La zone plate est centrée sur le banc de tir, décalé du monde par
// LAUNCH_ORIGIN — le relief est échantillonné en repère local à ce groupe,
// donc ce centrage sur (0,0) reste correct.
export const FLAT_RADIUS = 30
export const FLAT_FALLOFF = 60

// Chaîne de COLLINES marquées d'UN SEUL CÔTÉ (au nord, vers -Z) : elle monte
// progressivement en s'éloignant du pas de tir, avec des sommets ondulés. Reste
// loin de la base (zone proche calme) → relief franc à l'horizon sans noyer le
// site. Le côté opposé (+Z) reste ouvert/plat.
export const HILLS = {
  // Amplitude max des collines (bien plus que les ondulations locales).
  amplitude: 45,
  // Distance (|z|) où les collines COMMENCENT à monter, et où elles atteignent
  // leur pleine hauteur. Calées pour tenir dans le terrain visible (bord ~240).
  startZ: 120,
  fullZ: 300,
  // Ondulation des crêtes (variation en X) : longueur d'onde + amplitude relative.
  ridgeFreqX: 0.007,
  ridgeFreqZ: 0.005,
  ridgePhase: 1.2,
} as const
