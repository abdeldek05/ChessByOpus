import { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface UseCenteredSceneResult {
  scene: THREE.Group
}

/**
 * Charge un modèle GLB, le met à l'échelle pour que son rayon englobant
 * vaille toujours `targetRadius` (les modèles GLB n'ont pas tous la même
 * unité d'export — sans ça un radar modélisé en mètres réels apparaît
 * démesuré, voire hors du plan far de la caméra), puis le centre sur X/Z et
 * pose sa base à y=0 (utilisable aussi bien posé sur un sol que dans un
 * aperçu flottant : la caméra y recadre toujours sur le centre réel de
 * l'objet, peu importe où sa base est posée).
 */
export function useCenteredScene(modelPath: string, targetRadius = 3): UseCenteredSceneResult {
  const { scene: original } = useGLTF(modelPath)
  const scene = useMemo(() => original.clone(true), [original])

  useLayoutEffect(() => {
    scene.scale.setScalar(1)
    scene.position.set(0, 0, 0)
    scene.updateMatrixWorld(true)

    const rawSphere = new THREE.Box3().setFromObject(scene).getBoundingSphere(new THREE.Sphere())
    if (rawSphere.radius > 0) {
      scene.scale.setScalar(targetRadius / rawSphere.radius)
      scene.updateMatrixWorld(true)
    }

    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    scene.position.set(-center.x, -box.min.y, -center.z)

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
  }, [scene, targetRadius])

  return { scene }
}
