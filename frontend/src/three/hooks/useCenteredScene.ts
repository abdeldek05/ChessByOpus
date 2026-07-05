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
export function useCenteredScene(modelPath: string, targetRadius = 3, shadows = true): UseCenteredSceneResult {
  const { scene: original } = useGLTF(modelPath)
  const scene = useMemo(() => original.clone(true), [original])

  useLayoutEffect(() => {
    scene.scale.setScalar(1)
    scene.position.set(0, 0, 0)
    scene.updateMatrixWorld(true)

    // Box3.setFromObject mesure en coordonnées MONDE : si le modèle est rendu
    // dans un groupe décalé (ex. radar posé à distance dans la scène de
    // lancement), le recentrage soustrairait aussi l'offset du parent. On
    // repasse donc chaque mesure dans le repère du parent, où `position` vit.
    const parentInverse = new THREE.Matrix4()
    if (scene.parent) {
      scene.parent.updateWorldMatrix(true, false)
      parentInverse.copy(scene.parent.matrixWorld).invert()
    }

    const rawBox = new THREE.Box3().setFromObject(scene).applyMatrix4(parentInverse)
    const rawSphere = rawBox.getBoundingSphere(new THREE.Sphere())
    if (rawSphere.radius > 0) {
      scene.scale.setScalar(targetRadius / rawSphere.radius)
      scene.updateMatrixWorld(true)
    }

    const box = new THREE.Box3().setFromObject(scene).applyMatrix4(parentInverse)
    const center = box.getCenter(new THREE.Vector3())
    scene.position.set(-center.x, -box.min.y, -center.z)

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = shadows
        mesh.receiveShadow = shadows
      }
    })
  }, [scene, targetRadius, shadows])

  return { scene }
}
