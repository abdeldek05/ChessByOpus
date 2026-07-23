import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createHazeNoiseTexture } from '@/lib/createHazeNoiseTexture'
import { FOG_COLOR, getSunDirection } from '@/three/constants/launchDaylight'
import {
  HAZE_HEIGHT,
  HAZE_DENSITY,
  HAZE_DRIFT_SPEED,
  HAZE_NOISE_SCALE,
  HAZE_SUN_TINT,
} from '@/three/constants/horizonHaze'

const VERTEX_SHADER = `
  varying float vLocalY;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vLocalY = position.y;
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Dégradé vertical : opaque au ras du sol (mange la jonction terrain/horizon),
// s'efface en montant vers le ciel dégagé. Deux octaves de bruit dérivant à
// des vitesses/échelles différentes (anti « tapis roulant » — un seul bruit
// qui défile a un côté mécanique, deux qui se croisent paraissent organiques).
// Densité aussi modulée par l'incidence de vue (Fresnel-like) : la brume
// épaissit en la regardant en rasant, comme une vraie couche de vapeur.
const FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform vec3 uSunTint;
  uniform vec3 uSunDir;
  uniform vec3 uCameraPos;
  uniform float uHeight;
  uniform float uDensity;
  uniform float uNoiseScale;
  uniform float uDrift;
  uniform sampler2D uNoiseTex;
  varying float vLocalY;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    float heightFrac = clamp(vLocalY / uHeight, 0.0, 1.0);
    float verticalFade = 1.0 - smoothstep(0.15, 0.75, heightFrac);

    vec2 uvA = vec2(vUv.x * uNoiseScale + uDrift, vUv.y * uNoiseScale * 0.4);
    vec2 uvB = vec2(vUv.x * uNoiseScale * 2.3 - uDrift * 0.6, vUv.y * uNoiseScale * 0.9 + uDrift * 0.3);
    float nA = texture2D(uNoiseTex, uvA).r;
    float nB = texture2D(uNoiseTex, uvB).r;
    float n = mix(nA, nB, 0.4);

    vec3 viewDir = normalize(uCameraPos - vWorldPos);
    float grazing = 1.0 - abs(dot(viewDir, normalize(vWorldNormal)));
    float viewBoost = mix(1.0, 1.4, grazing);

    // Bruit module la densité (jamais à zéro) : évite les trous nets qui
    // révéleraient la géométrie cylindrique en dessous.
    float density = uDensity * verticalFade * mix(0.55, 1.0, n) * viewBoost;
    density = clamp(density, 0.0, 1.0);

    // Réchauffe vers la couleur du soleil là où la normale regarde sa
    // direction — la brume « attrape » la lumière golden hour au lieu de
    // rester une teinte plate uniforme.
    float sunFacing = clamp(dot(normalize(-vWorldNormal), uSunDir), 0.0, 1.0);
    vec3 color = mix(uColor, uSunTint, sunFacing * 0.55);

    gl_FragColor = vec4(color, density);
  }
`

/**
 * Matériau shader de la brume d'horizon (voir HorizonHaze.tsx) : dégradé
 * vertical (dense au sol, transparent en haut) modulé par DEUX octaves de
 * bruit organique dérivant à des vitesses différentes (anti « tapis
 * roulant »), une densité qui épaissit en incidence rasante (Fresnel-like,
 * rendu maximal — voir feedback_gpu_budget) et une teinte qui se réchauffe
 * vers la couleur du soleil côté golden hour. Un seul draw call, pas de
 * raymarching. Couleur de base alignée sur FOG_COLOR pour se fondre avec le
 * fog exponentiel de la scène sans raccord visible.
 */
export function useHorizonHazeMaterial(): THREE.ShaderMaterial {
  const noiseTexture = useMemo(() => createHazeNoiseTexture(), [])
  const sunDirection = useMemo(() => getSunDirection(), [])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uColor: { value: new THREE.Color(FOG_COLOR) },
        uSunTint: { value: new THREE.Color(HAZE_SUN_TINT) },
        uSunDir: { value: new THREE.Vector3(...sunDirection) },
        uCameraPos: { value: new THREE.Vector3() },
        uHeight: { value: HAZE_HEIGHT },
        uDensity: { value: HAZE_DENSITY },
        uNoiseScale: { value: HAZE_NOISE_SCALE },
        uDrift: { value: 0 },
        uNoiseTex: { value: noiseTexture },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      fog: false,
    })
  }, [noiseTexture, sunDirection])

  useFrame(({ camera }, delta) => {
    material.uniforms.uDrift.value += HAZE_DRIFT_SPEED * delta
    material.uniforms.uCameraPos.value.copy(camera.position)
  })

  useEffect(
    () => () => {
      material.dispose()
      noiseTexture.dispose()
    },
    [material, noiseTexture],
  )

  return material
}
