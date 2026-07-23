// Réglages du post-processing — RENDU MAXIMAL (voir feedback_gpu_budget,
// 2026-07-23) : le FPS n'est plus la contrainte, seule la STABILITÉ du
// driver AMD l'est encore (pas de retour au pic de triangles qui l'avait
// grillé — cette chaîne reste un post-effect 2D, sans rapport avec ce risque).

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
export const POSTFX_QUALITY: PostFxQuality = 'full'

// N8AO (occlusion ambiante GTAO) : ombres de contact douces dans les creux
// (base des touffes d'herbe, jointures des gradins du pad, socles des mâts) —
// l'effet qui « ancre » les objets au sol au lieu de les faire flotter. Coût
// GPU non négligeable, assumé (FPS relâché pendant cette passe de rendu).
// `AO_RADIUS` calé sur l'échelle RÉELLE des détails de contact (gradins du
// pad ~0.6-2.4u, herbe ~3.5u) — PAS sur l'échelle du terrain (des milliers
// d'unités) : l'AO doit rester un effet LOCAL, un rayon trop grand donnerait
// un assombrissement global plat plutôt que des contacts nets.
export const AO_RADIUS = 3
export const AO_INTENSITY = 3.6
export const AO_DISTANCE_FALLOFF = 1.2
export const AO_QUALITY: 'performance' | 'low' | 'medium' | 'high' | 'ultra' = 'ultra'

// God Rays (rayons crépusculaires) : le soleil (SunMesh, aligné sur l'HDRI)
// est occlus par le décor (arbres, rampe, pad) — c'est cette occlusion qui
// dessine les rayons qui en jaillissent. L'effet golden-hour le plus
// spectaculaire de la chaîne. Coût GPU notable, assumé (FPS relâché).
// EXPOSURE/WEIGHT reculés : les valeurs poussées (0.95/0.85) cumulées à l'IBL
// relevée et au bloom ont fait cramer toute l'image en blanc uniforme —
// gain modéré au lieu du maximum brut, voir le même correctif sur Bloom
// (PostFX.tsx) et ENVIRONMENT_INTENSITY (launchDaylight.ts).
export const GOD_RAYS_DENSITY = 0.96
export const GOD_RAYS_DECAY = 0.93
export const GOD_RAYS_WEIGHT = 0.7
export const GOD_RAYS_EXPOSURE = 0.8
export const GOD_RAYS_SAMPLES = 90
