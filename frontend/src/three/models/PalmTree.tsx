import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createPalmBarkTexture } from '@/lib/createPalmBarkTexture'
import { createPalmFrondTexture, FROND_GREEN, FROND_DRY } from '@/lib/createPalmFrondTexture'

interface PalmTreeProps {
  position: [number, number, number]
  rotationY: number
  scale: number
  /** Inclinaison du tronc (rad) — chaque palmier penche un peu différemment. */
  lean: number
}

// Tronc en 3 segments chaînés (courbure naturelle) : longueur et rayons effilés.
const SEG_LENGTH = 1.75
const SEG_RADII = [0.26, 0.2, 0.15, 0.11] as const
const SEG_BEND = 0.085 // rotation additionnelle par segment (rad)

// Couronne : palmes vertes arquées + palmes sèches pendantes (déterministes).
const GREEN_FRONDS = Array.from({ length: 11 }, (_, i) => ({
  yaw: (i / 11) * Math.PI * 2,
  pitch: 0.55 + ((i * 37) % 100) / 100 * 0.8,
  size: 0.9 + ((i * 53) % 100) / 100 * 0.35,
}))
const DRY_FRONDS = Array.from({ length: 4 }, (_, i) => ({
  yaw: (i / 4) * Math.PI * 2 + 0.4,
  pitch: 2.05 + ((i * 41) % 100) / 100 * 0.35,
  size: 0.75 + ((i * 29) % 100) / 100 * 0.2,
}))

/** Plan de palme ARQUÉ : la pointe retombe (droop) — silhouette naturelle. */
function buildFrondGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(0.95, 3.0, 1, 8).translate(0, 1.5, 0)
  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i)
    positions.setZ(i, -Math.pow(y / 3.0, 1.8) * 1.25)
  }
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Palmier-dattier RÉALISTE de l'oasis : stipe courbé texturé (écailles en
 * quinconce), couronne de palmes PENNÉES arquées (texture alpha de folioles) et
 * palmes sèches pendantes sous la couronne, régimes de dattes. Textures
 * procédurales cachées — aucun asset externe.
 */
export function PalmTree({ position, rotationY, scale, lean }: PalmTreeProps) {
  const frondGeometry = useMemo(() => buildFrondGeometry(), [])

  const { barkMaterial, greenMaterial, dryMaterial } = useMemo(() => {
    const bark = createPalmBarkTexture()
    bark.repeat.set(1, 1.4)
    return {
      barkMaterial: new THREE.MeshStandardMaterial({ map: bark, roughness: 0.95, metalness: 0 }),
      greenMaterial: new THREE.MeshStandardMaterial({
        map: createPalmFrondTexture(FROND_GREEN),
        alphaTest: 0.35,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0,
      }),
      dryMaterial: new THREE.MeshStandardMaterial({
        map: createPalmFrondTexture(FROND_DRY),
        alphaTest: 0.35,
        side: THREE.DoubleSide,
        roughness: 0.95,
        metalness: 0,
      }),
    }
  }, [])

  useEffect(
    () => () => {
      frondGeometry.dispose()
      barkMaterial.dispose()
      greenMaterial.dispose()
      dryMaterial.dispose()
    },
    [frondGeometry, barkMaterial, greenMaterial, dryMaterial],
  )

  return (
    <group position={position} rotation={[0, rotationY, lean]} scale={scale}>
      {/* Stipe : 3 segments chaînés, chacun un peu plus penché (courbure). */}
      <mesh position={[0, SEG_LENGTH / 2, 0]} material={barkMaterial} castShadow>
        <cylinderGeometry args={[SEG_RADII[1], SEG_RADII[0], SEG_LENGTH, 8]} />
      </mesh>
      <group position={[0, SEG_LENGTH, 0]} rotation={[0, 0, SEG_BEND]}>
        <mesh position={[0, SEG_LENGTH / 2, 0]} material={barkMaterial} castShadow>
          <cylinderGeometry args={[SEG_RADII[2], SEG_RADII[1], SEG_LENGTH, 8]} />
        </mesh>
        <group position={[0, SEG_LENGTH, 0]} rotation={[0, 0, SEG_BEND]}>
          <mesh position={[0, SEG_LENGTH / 2, 0]} material={barkMaterial} castShadow>
            <cylinderGeometry args={[SEG_RADII[3], SEG_RADII[2], SEG_LENGTH, 8]} />
          </mesh>

          {/* Couronne au sommet du dernier segment. */}
          <group position={[0, SEG_LENGTH, 0]}>
            {GREEN_FRONDS.map((frond, i) => (
              <group key={`g${i}`} rotation={[0, frond.yaw, 0]}>
                <mesh
                  geometry={frondGeometry}
                  material={greenMaterial}
                  rotation={[frond.pitch, 0, 0]}
                  scale={frond.size}
                  castShadow
                />
              </group>
            ))}
            {DRY_FRONDS.map((frond, i) => (
              <group key={`d${i}`} rotation={[0, frond.yaw, 0]}>
                <mesh
                  geometry={frondGeometry}
                  material={dryMaterial}
                  rotation={[frond.pitch, 0, 0]}
                  scale={frond.size}
                />
              </group>
            ))}
            {/* Régimes de dattes sous la couronne. */}
            <mesh position={[0.22, -0.18, 0.12]}>
              <sphereGeometry args={[0.16, 8, 6]} />
              <meshStandardMaterial color="#7a5a2e" roughness={0.85} />
            </mesh>
            <mesh position={[-0.18, -0.22, -0.1]}>
              <sphereGeometry args={[0.13, 8, 6]} />
              <meshStandardMaterial color="#8a6633" roughness={0.85} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
