import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface ParticleCloudConfig {
  count: number
  /** Durée de vie d'une particule (s). */
  life: number
  /** (Ré)émet une particule : renvoie position + vélocité de départ. */
  spawn: (position: THREE.Vector3, velocity: THREE.Vector3) => void
  /** Met à jour une particule vivante (âge 0..1) : taille, couleur, opacité. */
  update: (
    age: number,
    velocity: THREE.Vector3,
    out: { scale: number; color: THREE.Color; opacity: number },
  ) => void
  /** Émission active (vrai pendant la poussée). */
  emitting: React.RefObject<boolean>
}

interface ParticleCloudResult {
  meshRef: React.RefObject<THREE.InstancedMesh | null>
}

/**
 * Nuage de particules générique piloté par frame et rendu en `InstancedMesh`
 * (une seule draw-call, léger). Chaque particule a une position, une vélocité et
 * un âge ; le hook les fait vivre, les recycle à leur mort et, tant que
 * `emitting` est vrai, en réémet en continu. La couleur/taille/opacité par âge
 * est déléguée à `update` (flamme vs fumée). Aucune donnée physique : rendu pur.
 */
export function useParticleCloud({
  count,
  life,
  spawn,
  update,
  emitting,
}: ParticleCloudConfig): ParticleCloudResult {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  // État par particule (persistant entre frames).
  const state = useMemo(() => {
    const positions = Array.from({ length: count }, () => new THREE.Vector3())
    const velocities = Array.from({ length: count }, () => new THREE.Vector3())
    // Âges décalés au départ → apparition étalée, pas de « paquet » synchrone.
    const ages = new Float32Array(count).map(() => Math.random() * life)
    const alive = new Uint8Array(count) // 0 = morte (cachée), 1 = vivante
    return { positions, velocities, ages, alive }
  }, [count, life])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const scratch = useMemo(
    () => ({ scale: 1, color: new THREE.Color(), opacity: 1 }),
    [],
  )

  useFrame(({ camera }, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const { positions, velocities, ages, alive } = state
    const on = emitting.current
    const dt = Math.min(delta, 0.05) // borne (évite un saut après une pause)

    for (let i = 0; i < count; i++) {
      ages[i] += dt
      // Mort → réémission si la poussée dure, sinon on la cache.
      if (ages[i] >= life || alive[i] === 0) {
        if (on) {
          spawn(positions[i], velocities[i])
          ages[i] = 0
          alive[i] = 1
        } else {
          alive[i] = 0
          dummy.scale.setScalar(0.0001)
          dummy.position.set(0, -9999, 0)
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
          continue
        }
      }

      // Avance la particule.
      positions[i].addScaledVector(velocities[i], dt)
      const age = ages[i] / life

      // Apparence par âge (déléguée).
      update(age, velocities[i], scratch)

      dummy.position.copy(positions[i])
      dummy.scale.setScalar(Math.max(0.0001, scratch.scale))
      // Billboard : chaque plan fait face à la caméra (sprite volumique continu).
      dummy.quaternion.copy(camera.quaternion)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, scratch.color)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return { meshRef }
}
