import { EffectComposer, Bloom, N8AO, GodRays, SMAA, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import type * as THREE from 'three'
import type { PostFxQuality } from '@/three/constants/postFx'
import {
  AO_RADIUS,
  AO_INTENSITY,
  AO_DISTANCE_FALLOFF,
  AO_QUALITY,
  GOD_RAYS_DENSITY,
  GOD_RAYS_DECAY,
  GOD_RAYS_WEIGHT,
  GOD_RAYS_EXPOSURE,
  GOD_RAYS_SAMPLES,
} from '@/three/constants/postFx'

interface PostFxProps {
  /** 'smaa' = AA seul (budget serré) ; 'realistic' = rendu naturel ; 'full' = chaîne cinéma complète. */
  quality?: PostFxQuality
  /** Mesh du soleil (voir SunMesh) : source de l'effet God Rays. */
  sunRef: React.RefObject<THREE.Mesh | null>
}

/**
 * Post-traitement : SMAA obligatoire (l'AA natif est coupé pour les perfs) +
 * N8AO (occlusion ambiante GTAO, ombres de contact dans les creux) + God Rays
 * (rayons crépusculaires depuis SunMesh, occlus par le décor) + Bloom qui fait
 * légèrement rayonner le soleil/les surfaces claires. 'realistic' s'arrête là
 * (rendu naturel, pas stylisé) ; 'full' ajoute grain de pellicule + vignette
 * marquée pour un esprit cinéma plus dramatique. Tone mapping AgX géré par le
 * renderer. En qualité 'smaa', seul l'anti-aliasing tourne (garde-fou FPS).
 */
export function PostFX({ quality = 'realistic', sunRef }: PostFxProps) {
  if (quality === 'smaa') {
    return (
      <EffectComposer multisampling={0}>
        <SMAA />
      </EffectComposer>
    )
  }

  // N8AO AVANT le Bloom dans la chaîne : le Bloom doit rayonner à partir d'une
  // image déjà correctement ombrée (contacts assombris), pas l'inverse.
  const ao = (
    <N8AO
      aoRadius={AO_RADIUS}
      distanceFalloff={AO_DISTANCE_FALLOFF}
      intensity={AO_INTENSITY}
      quality={AO_QUALITY}
    />
  )

  // Rayons crépusculaires : le soleil (SunMesh) est occlus par le décor
  // (arbres, rampe, pad) — cette occlusion dessine les rayons qui en
  // jaillissent. AVANT le Bloom pour que celui-ci amplifie aussi les rayons.
  // `sunRef.current` peut valoir `null` au tout premier rendu (le mesh n'est
  // pas encore attaché) : sans risque, la lib gère explicitement ce cas et se
  // met à jour toute seule dès le rendu suivant (React re-render fréquent ici).
  const godRays = (
    <GodRays
      sun={sunRef as React.RefObject<THREE.Mesh>}
      density={GOD_RAYS_DENSITY}
      decay={GOD_RAYS_DECAY}
      weight={GOD_RAYS_WEIGHT}
      exposure={GOD_RAYS_EXPOSURE}
      samples={GOD_RAYS_SAMPLES}
      kernelSize={KernelSize.LARGE}
      blur
    />
  )

  // Seuil RELEVÉ (avant 0.65) : trop de surface (ciel, sol éclairé) dépassait
  // le seuil et le Bloom faisait « flasher » l'écran au lieu de ne faire
  // rayonner que les vraies zones très brillantes (soleil, reflets nets).
  const bloom = (
    <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.85} luminanceSmoothing={0.25} radius={0.5} />
  )

  if (quality === 'realistic') {
    return (
      <EffectComposer multisampling={0}>
        {ao}
        {godRays}
        {bloom}
        <SMAA />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={0}>
      {ao}
      {godRays}
      <Bloom mipmapBlur intensity={1.25} luminanceThreshold={0.5} luminanceSmoothing={0.4} radius={0.75} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.12} />
      <SMAA />
      <Vignette eskil={false} offset={0.2} darkness={0.7} />
    </EffectComposer>
  )
}
