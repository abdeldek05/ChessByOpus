import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SkyDomeProps {
  /** Couleur du zénith (haut du dôme). */
  zenithColor: string
  /** Couleur d'horizon — DOIT égaler la couleur du fog/fond pour un fondu invisible. */
  horizonColor: string
  /** Rayon du dôme — sous cameraFar sinon clippé (typ. cameraFar × 0.9). */
  radius: number
}

// Dégradé vertical minimal : horizon → zénith selon la hauteur de la direction
// de vue. Bien moins cher qu'un ciel physique (Preetham) — quelques
// instructions par pixel de ciel visible.
const VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const FRAGMENT = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  varying vec3 vDir;
  void main() {
    float h = pow(max(normalize(vDir).y, 0.0), 0.65);
    gl_FragColor = vec4(mix(uHorizon, uZenith, h), 1.0);
  }
`

/**
 * Dôme de ciel en dégradé vertical (golden hour) : sphère inversée qui SUIT la
 * caméra (la caméra de poursuite parcourt des milliers d'unités en vol — sans
 * suivi, on sortirait du dôme). `fog: false` obligatoire (sinon le dôme devient
 * un mur de fog) ; `depthWrite: false` pour rester derrière toute la scène.
 */
export function SkyDome({ zenithColor, horizonColor, radius }: SkyDomeProps) {
  const groupRef = useRef<THREE.Group>(null)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          uZenith: { value: new THREE.Color(zenithColor) },
          uHorizon: { value: new THREE.Color(horizonColor) },
        },
        side: THREE.BackSide,
        depthWrite: false,
        // depthTest false : le ciel est TOUJOURS le fond, jamais occulté par le
        // terrain/décor lointain (sinon, en dézoomant, le dôme finit "derrière"
        // de la géométrie proche du bord de son propre rayon → noir/absent).
        depthTest: false,
        fog: false,
      }),
    [zenithColor, horizonColor],
  )

  useFrame(({ camera }) => {
    groupRef.current?.position.copy(camera.position)
  })

  return (
    <group ref={groupRef}>
      <mesh material={material} renderOrder={-1}>
        <sphereGeometry args={[radius, 24, 16]} />
      </mesh>
    </group>
  )
}
