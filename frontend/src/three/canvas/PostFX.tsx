import { EffectComposer, Bloom, SMAA, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import type { PostFxQuality } from '@/three/constants/postFx'

interface PostFxProps {
  /** 'smaa' = AA seul (budget serré) ; 'full' = chaîne cinéma complète. */
  quality?: PostFxQuality
}

/**
 * Post-traitement cinéma (esprit « film Apollo ») : Bloom golden hour qui fait
 * rayonner le soleil, les reflets sur l'eau et les métaux ; grain de pellicule
 * (Noise en OVERLAY léger) qui casse l'aspect numérique et donne le cachet
 * argentique ; SMAA (l'AA natif étant coupé pour les perfs) ; et un vignettage
 * marqué pour concentrer le regard. Tone mapping ACES géré par le renderer.
 * En qualité 'smaa', seul l'anti-aliasing tourne (garde-fou FPS).
 */
export function PostFX({ quality = 'full' }: PostFxProps) {
  if (quality === 'smaa') {
    return (
      <EffectComposer multisampling={0}>
        <SMAA />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={1.25}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.4}
        radius={0.75}
      />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.12} />
      <SMAA />
      <Vignette eskil={false} offset={0.2} darkness={0.7} />
    </EffectComposer>
  )
}
