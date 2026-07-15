// Garde-fous du post-processing (budget 60 FPS, GPU AMD milieu de gamme) :
// une seule constante à basculer pour dégrader/désactiver la chaîne si le FPS
// chute, sans toucher au code des composants.

export type PostFxQuality = 'smaa' | 'full'

/** Coupe TOUT le post-processing (retour au rendu direct) si false. */
export const POSTFX_ENABLED = true

/**
 * 'smaa' : anti-aliasing seul (indispensable — l'AA natif du Canvas est coupé).
 * 'full' : SMAA + Bloom + grain + vignette (rendu cinéma complet).
 */
export const POSTFX_QUALITY: PostFxQuality = 'full'
