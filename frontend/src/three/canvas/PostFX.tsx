import { EffectComposer, Bloom, SMAA, Vignette } from '@react-three/postprocessing'

/**
 * Post-traitement de la scène de nuit : Bloom (fait rayonner la lune, l'écran
 * du pupitre, le bouton LANCER et les feux du radar), SMAA (anti-aliasing bon
 * marché puisque l'AA natif du canvas est coupé pour les perfs), et un léger
 * vignettage pour l'ambiance cinématique. Le tone mapping ACES reste géré par
 * le renderer (voir LaunchSceneCanvas) — pas de double traitement ici.
 */
export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={0.85}
        luminanceThreshold={0.22}
        luminanceSmoothing={0.3}
        radius={0.55}
      />
      <SMAA />
      <Vignette eskil={false} offset={0.15} darkness={0.6} />
    </EffectComposer>
  )
}
