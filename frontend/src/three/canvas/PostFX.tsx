import { EffectComposer, Bloom, SMAA, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

/**
 * Post-traitement cinéma (esprit « film Apollo ») : Bloom golden hour qui fait
 * rayonner le soleil, les reflets sur l'eau et les métaux ; grain de pellicule
 * (Noise en OVERLAY léger) qui casse l'aspect numérique et donne le cachet
 * argentique ; SMAA (l'AA natif étant coupé pour les perfs) ; et un vignettage
 * marqué pour concentrer le regard. Tone mapping ACES géré par le renderer.
 */
export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={1.1}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.35}
        radius={0.7}
      />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.28} />
      <SMAA />
      <Vignette eskil={false} offset={0.2} darkness={0.7} />
    </EffectComposer>
  )
}
