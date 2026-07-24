import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createHazeNoiseTexture } from '@/lib/createHazeNoiseTexture'
import { getSunDirection, FOG_COLOR } from '@/three/constants/launchDaylight'
import {
  CLOUD_LAYER_THICKNESS,
  CLOUD_RAYMARCH_STEPS,
  CLOUD_COVERAGE,
  CLOUD_DENSITY,
  CLOUD_DRIFT_SPEED,
} from '@/three/constants/volumetricClouds'

const VERTEX_SHADER = `
  varying vec3 vWorldPos;
  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Raymarching COURT dans une tranche horizontale : pour chaque pixel du plan,
// on remonte le rayon caméra→fragment sur `uSteps` pas répartis dans
// l'épaisseur de la couche, on accumule la densité (bruit fBm 2D tuilé,
// dérivant), et on éclaire vers le soleil. Le nombre de pas est un PLAFOND DUR
// du coût (voir volumetricClouds.ts) — on ne parcourt jamais un volume infini.
const FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D uNoise;
  uniform vec3 uCameraPos;
  uniform vec3 uSunDir;
  uniform vec3 uCloudColor;
  uniform vec3 uSunTint;
  uniform float uThickness;
  uniform float uCoverage;
  uniform float uDensity;
  uniform float uDrift;
  uniform float uSteps;
  varying vec3 vWorldPos;

  // Densité de nuage à une position monde : fBm 2 octaves via la texture de
  // bruit tuilée (échelle monde large), seuillée par la couverture. Le facteur
  // vertical rend la tranche plus dense au centre, effilée aux bords.
  float cloudDensity(vec3 p, float layerY) {
    vec2 uv = p.xz * 0.00035 + vec2(uDrift, uDrift * 0.6);
    float n = texture2D(uNoise, uv).r;
    n += texture2D(uNoise, uv * 2.7 - uDrift * 0.4).r * 0.5;
    n /= 1.5;
    float shape = smoothstep(uCoverage, uCoverage + 0.25, n);
    // Profil vertical : 1 au milieu de la tranche, 0 aux bords.
    float vFrac = clamp(abs(p.y - layerY) / (uThickness * 0.5), 0.0, 1.0);
    return shape * (1.0 - vFrac * vFrac);
  }

  void main() {
    vec3 rayDir = normalize(vWorldPos - uCameraPos);
    float layerY = vWorldPos.y;
    int steps = int(uSteps);
    float stepLen = uThickness / uSteps;
    // On démarre au bas de la tranche et on monte le long du rayon.
    vec3 p = vWorldPos - rayDir * (uThickness * 0.5);

    float transmittance = 1.0;
    float lit = 0.0;
    for (int i = 0; i < 64; i++) {
      if (i >= steps) break;
      float d = cloudDensity(p, layerY) * uDensity * stepLen * 0.02;
      if (d > 0.001) {
        // Éclairage bon marché : un pas vers le soleil pour l'auto-ombrage.
        float shadow = cloudDensity(p + uSunDir * stepLen, layerY);
        float light = mix(1.0, 0.35, shadow);
        lit += transmittance * d * light;
        transmittance *= (1.0 - d);
        if (transmittance < 0.02) break;
      }
      p += rayDir * stepLen;
    }

    float alpha = 1.0 - transmittance;
    if (alpha < 0.01) discard;
    vec3 color = mix(uCloudColor, uSunTint, clamp(lit, 0.0, 1.0));
    gl_FragColor = vec4(color, alpha);
  }
`

/**
 * Matériau shader des nuages volumétriques (voir VolumetricClouds.tsx) :
 * raymarching COURT (CLOUD_RAYMARCH_STEPS pas, plafond dur du coût) dans une
 * tranche horizontale à hauteur de vol — vrais nuages 3D vus de dessous/dedans
 * quand la fusée les traverse, pas des billboards plats. Bruit fBm tuilé
 * (réutilise createHazeNoiseTexture, pas de bruit GLSL coûteux). Teinte de base
 * FOG_COLOR + réchauffe golden hour vers le soleil, cohérent avec le reste de
 * l'atmosphère. Zéro allocation par frame (uniforms mutés en place).
 */
export function useVolumetricCloudMaterial(): THREE.ShaderMaterial {
  const noise = useMemo(() => createHazeNoiseTexture(), [])
  const sunDir = useMemo(() => getSunDirection(), [])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uNoise: { value: noise },
        uCameraPos: { value: new THREE.Vector3() },
        uSunDir: { value: new THREE.Vector3(...sunDir) },
        uCloudColor: { value: new THREE.Color('#f2ede4') },
        uSunTint: { value: new THREE.Color(FOG_COLOR) },
        uThickness: { value: CLOUD_LAYER_THICKNESS },
        uCoverage: { value: CLOUD_COVERAGE },
        uDensity: { value: CLOUD_DENSITY },
        uDrift: { value: 0 },
        uSteps: { value: CLOUD_RAYMARCH_STEPS },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    })
  }, [noise, sunDir])

  useFrame(({ camera }, delta) => {
    material.uniforms.uCameraPos.value.copy(camera.position)
    material.uniforms.uDrift.value += CLOUD_DRIFT_SPEED * delta
  })

  useEffect(
    () => () => {
      material.dispose()
      noise.dispose()
    },
    [material, noise],
  )

  return material
}
