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
import { PHOTO_MODE } from '@/three/constants/photoMode'

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
      key="ao"
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
      key="godrays"
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
    <Bloom
      key="bloom"
      mipmapBlur
      intensity={0.45}
      luminanceThreshold={0.85}
      luminanceSmoothing={0.25}
      radius={0.5}
    />
  )

  if (quality === 'realistic') {
    // God Rays RETIRÉ de cette chaîne (garde-fou 70 FPS) : c'est la passe
    // multi-samples plein écran la plus coûteuse — sur GPU AMD milieu de gamme
    // elle plombait le framerate (chutes à ~4 FPS → fusée par bonds). On garde
    // AO (contacts) + Bloom (halo) + SMAA (AA), l'ambiance golden hour vient
    // surtout de l'HDRI/lumière, pas des rayons. Voir feedback_gpu_budget.
    //
    // EXCEPTION mode photo : les rayons crépusculaires sont précisément ce qui
    // fait le « beau soleil » sur une capture, et le FPS n'y est plus une
    // contrainte — on les remet dans la chaîne.
    // Deux chaînes écrites en toutes lettres : EffectComposer type ses enfants
    // comme des Element non-nullables et refuse aussi bien `{cond && …}` qu'un
    // tableau — la duplication est ce que ce typage impose.
    if (PHOTO_MODE) {
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
        {bloom}
        <SMAA />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={0}>
      {ao}
      {godRays}
      {/* Seuil >= celui du mode 'realistic' (0.85) — JAMAIS plus bas : un
          seuil réduit fait contribuer le ciel/sol golden hour entier au
          bloom, qui se met alors à cramer toute l'image en blanc uniforme
          (constaté : écran quasi entièrement blanc-flash). Voir le même
          garde-fou documenté juste au-dessus pour 'realistic'. */}
      <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.85} luminanceSmoothing={0.25} radius={0.6} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.06} />
      <SMAA />
      <Vignette eskil={false} offset={0.22} darkness={0.75} />
    </EffectComposer>
  )
}
