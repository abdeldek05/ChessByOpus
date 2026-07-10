import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { makeRng } from '@/lib/makeRng'
import {
  DEBRIS_COUNT,
  DEBRIS_GRAVITY,
  DEBRIS_SPEED_MIN,
  DEBRIS_SPEED_MAX,
  DEBRIS_UP_BIAS,
  DEBRIS_RESTITUTION,
  DEBRIS_FRICTION,
  DEBRIS_AIR_DRAG,
  DEBRIS_SETTLE_SPEED,
  DEBRIS_SPIN_MAX,
  DEBRIS_SIZE_MIN,
  DEBRIS_SIZE_MAX,
  DEBRIS_COLORS,
  EMBER_FRACTION,
  EMBER_FADE_SEC,
  EMBER_COLOR,
  DEBRIS_SEED,
} from '@/three/constants/mesangeDebris'

interface MesangeDebrisProps {
  /** Temps écoulé depuis l'impact (s), piloté par le hook de vol. */
  elapsedRef: React.RefObject<number>
}

/** État d'un fragment : paramètres de naissance + état mutable intégré par frame. */
interface Fragment {
  dir: THREE.Vector3
  speed: number
  spinAxis: THREE.Vector3
  spinInit: number
  size: number
  color: string
  ember: boolean
  kind: 'box' | 'cyl'
  // État mutable (réinitialisé au rejeu).
  position: THREE.Vector3
  velocity: THREE.Vector3
  spinSpeed: number
  angle: number
  resting: boolean
}

/** (Ré)initialise l'état mutable d'un fragment depuis ses paramètres de naissance. */
function resetFragment(f: Fragment): void {
  f.position.set(0, 0.4, 0)
  f.velocity.copy(f.dir).multiplyScalar(f.speed)
  f.spinSpeed = f.spinInit
  f.angle = 0
  f.resting = false
}

/**
 * Destruction RÉALISTE de la Mesange à l'impact : fragments éjectés en éventail
 * (tôles + tronçons), intégrés frame par frame — gravité, traînée, REBONDS au
 * sol avec perte d'énergie, puis immobilisation. Une partie des fragments est
 * incandescente (braises qui s'éteignent). Déterministe (même crash au rejeu),
 * zéro allocation par frame.
 */
export function MesangeDebris({ elapsedRef }: MesangeDebrisProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const lastT = useRef(0)

  const fragments = useMemo<Fragment[]>(() => {
    const rng = makeRng(DEBRIS_SEED)
    return Array.from({ length: DEBRIS_COUNT }, () => {
      const angle = rng() * Math.PI * 2
      const up = DEBRIS_UP_BIAS + rng() * 0.7
      const dir = new THREE.Vector3(Math.cos(angle), up, Math.sin(angle)).normalize()
      const f: Fragment = {
        dir,
        speed: DEBRIS_SPEED_MIN + rng() * (DEBRIS_SPEED_MAX - DEBRIS_SPEED_MIN),
        spinAxis: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize(),
        spinInit: (0.4 + rng() * 0.6) * DEBRIS_SPIN_MAX,
        size: DEBRIS_SIZE_MIN + rng() * (DEBRIS_SIZE_MAX - DEBRIS_SIZE_MIN),
        color: DEBRIS_COLORS[Math.floor(rng() * DEBRIS_COLORS.length)],
        ember: rng() < EMBER_FRACTION,
        kind: rng() < 0.4 ? 'cyl' : 'box',
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        spinSpeed: 0,
        angle: 0,
        resting: false,
      }
      resetFragment(f)
      return f
    })
  }, [])

  useFrame((_, delta) => {
    const t = elapsedRef.current
    const dt = Math.min(delta, 0.05)

    // Rejeu détecté (le temps est revenu en arrière) → on refait le crash.
    if (t < lastT.current - 0.1) fragments.forEach(resetFragment)
    lastT.current = t

    const emberGlow = Math.max(0, 1 - t / EMBER_FADE_SEC)

    fragments.forEach((f, i) => {
      const mesh = meshRefs.current[i]
      if (!mesh) return

      if (!f.resting) {
        // Intégration : gravité + traînée, puis avance.
        f.velocity.y -= DEBRIS_GRAVITY * dt
        f.velocity.multiplyScalar(Math.max(0, 1 - DEBRIS_AIR_DRAG * dt))
        f.position.addScaledVector(f.velocity, dt)

        // Rebond au sol (plancher local = demi-épaisseur du fragment).
        const floor = f.size * 0.28
        if (f.position.y < floor && f.velocity.y < 0) {
          f.position.y = floor
          f.velocity.y = -f.velocity.y * DEBRIS_RESTITUTION
          f.velocity.x *= DEBRIS_FRICTION
          f.velocity.z *= DEBRIS_FRICTION
          f.spinSpeed *= 0.55
          if (f.velocity.length() < DEBRIS_SETTLE_SPEED) {
            f.resting = true
            f.spinSpeed = 0
          }
        }
        f.angle += f.spinSpeed * dt
        mesh.position.copy(f.position)
        mesh.quaternion.setFromAxisAngle(f.spinAxis, f.angle)
      }

      // Braises : émissif qui s'éteint avec le temps.
      const mat = matRefs.current[i]
      if (mat && f.ember) mat.emissiveIntensity = emberGlow * 2.6
    })
  })

  return (
    <group>
      {fragments.map((f, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshRefs.current[i] = m
          }}
          castShadow
        >
          {f.kind === 'cyl' ? (
            <cylinderGeometry args={[f.size * 0.32, f.size * 0.32, f.size, 8]} />
          ) : (
            <boxGeometry args={[f.size, f.size * 0.5, f.size * 0.75]} />
          )}
          <meshStandardMaterial
            ref={(m) => {
              matRefs.current[i] = m
            }}
            color={f.color}
            roughness={0.65}
            metalness={0.35}
            emissive={f.ember ? EMBER_COLOR : '#000000'}
            emissiveIntensity={f.ember ? 2.6 : 0}
          />
        </mesh>
      ))}
    </group>
  )
}
