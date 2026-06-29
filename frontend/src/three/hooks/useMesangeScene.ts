import { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MESANGE_MODEL_PATH } from '@/three/constants/modelPaths'

interface UseMesangeSceneResult {
  scene: THREE.Group
}

/**
 * Charge le modèle Mésange, l'oriente debout (axe le plus long sur Y) et le
 * recentre sur l'origine, une seule fois après le chargement.
 *
 * On travaille sur un CLONE : `useGLTF` met la scène en cache globalement, et
 * nos transformations (dont une rotation relative pour retourner le nez) ne
 * sont pas idempotentes — les appliquer sur l'objet partagé casserait le
 * rendu lors d'un remontage ou d'une réutilisation du modèle.
 */
export function useMesangeScene(modelPath: string): UseMesangeSceneResult {
  const { scene: original } = useGLTF(modelPath)
  const scene = useMemo(() => original.clone(true), [original])

  useLayoutEffect(() => {
    scene.updateMatrixWorld(true)
    const initialSize = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3())

    let longestAxis: 'x' | 'y' | 'z' = 'y'
    let longestLength = initialSize.y
    if (initialSize.x > longestLength) {
      longestAxis = 'x'
      longestLength = initialSize.x
    }
    if (initialSize.z > longestLength) {
      longestAxis = 'z'
      longestLength = initialSize.z
    }

    if (longestAxis === 'x') scene.rotation.z = Math.PI / 2
    else if (longestAxis === 'z') scene.rotation.x = -Math.PI / 2

    scene.updateMatrixWorld(true)

    // La pointe (nez) a toujours un rayon (XZ) plus fin que la base/les
    // ailerons : on compare le rayon moyen près du sommet et près de la
    // base pour savoir si le modèle est à l'endroit, et on le retourne
    // sinon. Évite de coder en dur un sens qui dépend de l'export source.
    const orientedBox = new THREE.Box3().setFromObject(scene)
    const orientedSize = orientedBox.getSize(new THREE.Vector3())
    const topThreshold = orientedBox.max.y - orientedSize.y * 0.2
    const bottomThreshold = orientedBox.min.y + orientedSize.y * 0.2

    let topRadiusSum = 0
    let topCount = 0
    let bottomRadiusSum = 0
    let bottomCount = 0

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const meshBox = new THREE.Box3().setFromObject(mesh)
      const meshCenter = meshBox.getCenter(new THREE.Vector3())
      const meshSize = meshBox.getSize(new THREE.Vector3())
      const radius = (meshSize.x + meshSize.z) / 2

      if (meshCenter.y >= topThreshold) {
        topRadiusSum += radius
        topCount += 1
      } else if (meshCenter.y <= bottomThreshold) {
        bottomRadiusSum += radius
        bottomCount += 1
      }
    })

    const topAvgRadius = topCount > 0 ? topRadiusSum / topCount : Infinity
    const bottomAvgRadius = bottomCount > 0 ? bottomRadiusSum / bottomCount : Infinity
    const noseIsAtBottom = bottomAvgRadius < topAvgRadius

    if (noseIsAtBottom) scene.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI)

    scene.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    scene.position.set(-center.x, -center.y, -center.z)

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
  }, [scene])

  return { scene }
}

useGLTF.preload(MESANGE_MODEL_PATH)
