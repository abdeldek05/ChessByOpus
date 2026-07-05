import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'

/**
 * Pose un groupe exactement sur une surface horizontale : mesure sa bounding
 * box réelle après chargement et ajuste `position.y` pour que son point le
 * plus bas affleure `surfaceY`. Idempotent (un second passage ne bouge rien),
 * donc sûr vis-à-vis des remontages et du StrictMode.
 */
export function useRestOnSurface(groupRef: RefObject<THREE.Group | null>, surfaceY: number): void {
  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(group)
    if (box.isEmpty()) return
    group.position.y += surfaceY - box.min.y
    group.updateMatrixWorld(true)
  }, [groupRef, surfaceY])
}
