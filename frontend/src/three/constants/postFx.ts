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
// 'realistic' (plus 'full') : on RETIRE grain de pellicule + vignette — ces
// deux couches « salissaient » l'air (texture sur toute l'image + bords
// assombris) et tuaient la netteté du DPR plein écran. Air propre demandé.
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
export const AO_INTENSITY = 3.6
export const AO_DISTANCE_FALLOFF = 1.2
// ABAISSÉ (ultra → medium) : l'AO en 'ultra' est la passe plein écran la plus
// coûteuse de la chaîne — sur GPU milieu de gamme (AMD RX 6500M) elle faisait
// chuter le FPS jusqu'à ~4, ce qui faisait AVANCER LA FUSÉE PAR BONDS (position
// rafraîchie 4×/s au lieu de 60). 'medium' garde des ombres de contact
// crédibles pour un coût très inférieur. Priorité fluidité (voir feedback_gpu_budget,
// MAJ : 60 FPS stable requis, la fusée en vol doit être fluide).
export const AO_QUALITY: 'performance' | 'low' | 'medium' | 'high' | 'ultra' = 'performance'

// God Rays (rayons crépusculaires) : le soleil (SunMesh, aligné sur l'HDRI)
// est occlus par le décor (arbres, rampe, pad) — c'est cette occlusion qui
// dessine les rayons qui en jaillissent. L'effet golden-hour le plus
// spectaculaire de la chaîne. Coût GPU notable, assumé (FPS relâché).
// EXPOSURE/WEIGHT reculés : les valeurs poussées (0.95/0.85) cumulées à l'IBL
// relevée et au bloom ont fait cramer toute l'image en blanc uniforme —
// gain modéré au lieu du maximum brut, voir le même correctif sur Bloom
// (PostFX.tsx) et ENVIRONMENT_INTENSITY (launchDaylight.ts).
// Reculés encore (0.7/0.8 → 0.45/0.55) : les god rays contribuaient au voile
// lumineux dans l'air. On garde un halo golden hour discret, plus un filtre.
export const GOD_RAYS_DENSITY = 0.9
export const GOD_RAYS_DECAY = 0.92
export const GOD_RAYS_WEIGHT = 0.45
export const GOD_RAYS_EXPOSURE = 0.55
// ABAISSÉ (60 → 30 samples) : les God Rays échantillonnent le tampon N fois
// par pixel — 60 samples plein écran est un poste lourd cumulé à l'AO. 30
// garde le halo golden hour visible pour la moitié du coût. Priorité fluidité.
export const GOD_RAYS_SAMPLES = 30
