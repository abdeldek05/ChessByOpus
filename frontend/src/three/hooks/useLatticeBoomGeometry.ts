import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three-stdlib'
import { RAIL } from '@/three/constants/launchRail'

const UP = new THREE.Vector3(0, 1, 0)

// Barreau cylindrique entre deux points 3D, fusionnable.
function strut(p0: THREE.Vector3, p1: THREE.Vector3, radius: number): THREE.BufferGeometry {
  const dir = new THREE.Vector3().subVectors(p1, p0)
  const len = dir.length()
  const geo = new THREE.CylinderGeometry(radius, radius, len, 6)
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()))
  const mid = new THREE.Vector3().addVectors(p0, p1).multiplyScalar(0.5)
  geo.translate(mid.x, mid.y, mid.z)
  return geo
}

/**
 * Fût-treillis vertical (le rail) fusionné en une seule géométrie : 4 membrures
 * d'angle, un anneau de traverses à chaque nœud, et des diagonales en zig-zag
 * sur chaque face — l'aspect classique d'un rail de lancement en lattice. Un
 * seul mesh au rendu (perf). Le fût est bâti droit le long de +Y ; c'est le
 * parent qui l'incline à l'angle de tir.
 */
export function useLatticeBoomGeometry(): THREE.BufferGeometry {
  return useMemo(() => {
    const { boomLength: L, boomWidth: W, chordRadius, braceRadius, bays } = RAIL
    const w = W / 2
    const corners: [number, number][] = [
      [-w, -w],
      [w, -w],
      [w, w],
      [-w, w],
    ]
    const nodeY = (i: number) => (i * L) / bays
    const at = (c: number, y: number) => new THREE.Vector3(corners[c][0], y, corners[c][1])

    const parts: THREE.BufferGeometry[] = []

    // Membrures d'angle (4 arêtes verticales).
    for (let c = 0; c < 4; c++) parts.push(strut(at(c, 0), at(c, L), chordRadius))

    // Traverses : anneau à chaque nœud.
    for (let i = 0; i <= bays; i++) {
      const y = nodeY(i)
      for (let e = 0; e < 4; e++) parts.push(strut(at(e, y), at((e + 1) % 4, y), braceRadius))
    }

    // Diagonales : une par face et par travée, direction alternée (zig-zag).
    for (let i = 0; i < bays; i++) {
      const y0 = nodeY(i)
      const y1 = nodeY(i + 1)
      for (let e = 0; e < 4; e++) {
        const a = i % 2 === 0 ? e : (e + 1) % 4
        const b = i % 2 === 0 ? (e + 1) % 4 : e
        parts.push(strut(at(a, y0), at(b, y1), braceRadius))
      }
    }

    return mergeBufferGeometries(parts, false) ?? parts[0]
  }, [])
}
