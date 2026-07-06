import { useMemo } from 'react'
import * as THREE from 'three'
import { Stars } from '@react-three/drei'
import { MOON_POSITION, NIGHT_SKY, STARS } from '@/three/constants/launchDaylight'

/**
 * Ciel de nuit claire, entièrement statique (aucun useFrame) :
 * - un dôme dégradé dont le shader peint le disque lunaire et son halo ;
 * - un champ d'étoiles figé.
 * Aucun nuage. Objectif : un ciel net à coût quasi nul pour préserver les FPS.
 */
export function DaylightSky() {
  const skyMaterial = useMemo(() => {
    const moonDir = new THREE.Vector3(...MOON_POSITION).normalize()
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uZenith: { value: new THREE.Color(NIGHT_SKY.zenithColor) },
        uHorizon: { value: new THREE.Color(NIGHT_SKY.horizonColor) },
        uMoonColor: { value: new THREE.Color(NIGHT_SKY.moonColor) },
        uMoonHalo: { value: new THREE.Color(NIGHT_SKY.moonHaloColor) },
        uMoonDir: { value: moonDir },
        uMoonSize: { value: NIGHT_SKY.moonSize },
        uMoonHaloStrength: { value: NIGHT_SKY.moonHalo },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        uniform vec3 uZenith;
        uniform vec3 uHorizon;
        uniform vec3 uMoonColor;
        uniform vec3 uMoonHalo;
        uniform vec3 uMoonDir;
        uniform float uMoonSize;
        uniform float uMoonHaloStrength;

        void main() {
          float h = clamp(vDir.y, 0.0, 1.0);
          vec3 col = mix(uHorizon, uZenith, pow(h, 0.55));

          // Disque lunaire + halo.
          float dm = distance(normalize(vDir), uMoonDir);
          float disk = smoothstep(uMoonSize, uMoonSize * 0.55, dm);
          float halo = uMoonHaloStrength * exp(-dm * 6.0);
          col = mix(col, uMoonHalo, halo);
          col = mix(col, uMoonColor, disk);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  }, [])

  return (
    <>
      <mesh scale={[900, 900, 900]} frustumCulled={false}>
        <sphereGeometry args={[1, 24, 12]} />
        <primitive object={skyMaterial} attach="material" />
      </mesh>

      <Stars
        radius={STARS.radius}
        depth={STARS.depth}
        count={STARS.count}
        factor={STARS.factor}
        saturation={STARS.saturation}
        fade={STARS.fade}
        speed={0}
      />
    </>
  )
}
