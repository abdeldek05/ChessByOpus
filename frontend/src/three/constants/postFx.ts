// Garde-fous du post-processing (budget 60 FPS, GPU AMD milieu de gamme) :
// une seule constante à basculer pour dégrader/désactiver la chaîne si le FPS
// chute, sans toucher au code des composants.

export type PostFxQuality = 'smaa' | 'realistic' | 'full'

/** Coupe TOUT le post-processing (retour au rendu direct) si false. */
export const POSTFX_ENABLED = true

/**
 * 'smaa' : anti-aliasing seul (indispensable — l'AA natif du Canvas est coupé).
 * 'realistic' : SMAA + Bloom doux + N8AO — soleil/surfaces claires rayonnent
 * légèrement, ombres de contact dans les creux, sans grain ni vignette (rendu
 * naturel, pas stylisé).
 * 'full' : idem + Bloom fort + grain + vignette (rendu cinéma, plus dramatique).
 */
export const POSTFX_QUALITY: PostFxQuality = 'realistic'

// N8AO (occlusion ambiante GTAO) : ombres de contact douces dans les creux
// (base des touffes d'herbe, jointures des gradins du pad, socles des mâts) —
// l'effet qui « ancre » les objets au sol au lieu de les faire flotter. Coût
// GPU non négligeable, assumé (FPS relâché pendant cette passe de rendu).
// `AO_RADIUS` calé sur l'échelle RÉELLE des détails de contact (gradins du
// pad ~0.6-2.4u, herbe ~3.5u) — PAS sur l'échelle du terrain (des milliers
// d'unités) : l'AO doit rester un effet LOCAL, un rayon trop grand donnerait
// un assombrissement global plat plutôt que des contacts nets.
export const AO_RADIUS = 3
export const AO_INTENSITY = 3
export const AO_DISTANCE_FALLOFF = 1.2
export const AO_QUALITY: 'performance' | 'low' | 'medium' | 'high' | 'ultra' = 'high'

// God Rays (rayons crépusculaires) : le soleil (SunMesh, aligné sur l'HDRI)
// est occlus par le décor (arbres, rampe, pad) — c'est cette occlusion qui
// dessine les rayons qui en jaillissent. L'effet golden-hour le plus
// spectaculaire de la chaîne. Coût GPU notable, assumé (FPS relâché).
export const GOD_RAYS_DENSITY = 0.96
export const GOD_RAYS_DECAY = 0.93
export const GOD_RAYS_WEIGHT = 0.5
export const GOD_RAYS_EXPOSURE = 0.6
export const GOD_RAYS_SAMPLES = 60
