// Champ de brins d'herbe instanciés (InstancedMesh) autour du banc de tir :
// de vrais brins 3D qui ondulent au vent via un shader. Limité à un patch
// dense autour de la base — au-delà, la texture de sol prend le relais — pour
// rester fluide malgré le grand nombre d'instances.

// Nombre de brins : compromis densité/perf. ~40 k tient largement 60 fps.
export const BLADE_COUNT = 40000

// Le patch couvre un disque : brins semés jusqu'à ce rayon autour de l'origine
// du banc, mais pas sous la dalle (rayon intérieur laissé nu).
export const PATCH_RADIUS = 46
export const PATCH_INNER_RADIUS = 7.5

// Dimensions d'un brin (plan étroit). Hauteur variée par instance.
export const BLADE_WIDTH = 0.06
export const BLADE_HEIGHT = 0.42
export const BLADE_HEIGHT_VARIANCE = 0.5

// Vent : amplitude d'oscillation (radians) et vitesse temporelle.
export const WIND_STRENGTH = 0.28
export const WIND_SPEED = 1.6

export const BLADE_SEED = 20260706

// Dégradé base → pointe des brins (repris de la palette pelouse).
export const BLADE_COLOR_BASE = '#2f5417'
export const BLADE_COLOR_TIP = '#7fae3f'
