import { useEffect } from 'react'
import * as THREE from 'three'
import { useMesangeScene } from '@/three/hooks/useMesangeScene'
import { useMesangeMaterialQuality } from '@/three/hooks/useMesangeMaterialQuality'
import { MESANGE_MODEL_PATH } from '@/three/constants/modelPaths'

interface MesangeStaticProps {
  /** Désactive le fog sur le modèle (vol) : la fusée reste NETTE en altitude,
   *  sans être noyée par la brume calée sur le rayon du terrain quand elle
   *  monte à des dizaines de km. Laisser false au sol (cohérence avec le décor). */
  noFog?: boolean
  /** Modèle ALLÉGÉ (leurres) : coupe les ombres portées/reçues — en essaim,
   *  N fusées qui projettent une ombre chacune plombent le FPS, et l'ombre
   *  d'un leurre en altitude est invisible/inutile. Défaut false (Roi = ombré). */
  lite?: boolean
}

/**
 * Mesange dressée et immobile pour la scène de lancement (contrairement à
 * `MesangeModel` qui tourne sur lui-même pour la vitrine de l'accueil). Même
 * chargement/orientation, sans rotation ni inclinaison au pointeur.
 */
export function MesangeStatic({ noFog = false, lite = false }: MesangeStaticProps) {
  const { scene } = useMesangeScene(MESANGE_MODEL_PATH)
  useMesangeMaterialQuality(scene)

  useEffect(() => {
    if (!noFog) return
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m) => {
        ;(m as THREE.Material & { fog?: boolean }).fog = false
        m.needsUpdate = true
      })
    })
  }, [scene, noFog])

  // Modèle allégé (leurres) : coupe les ombres que useMesangeScene a activées —
  // gros gain en essaim (une passe d'ombre par fusée sinon). Après ce hook dans
  // l'ordre de montage, donc écrase bien le castShadow/receiveShadow posé là.
  useEffect(() => {
    if (!lite) return
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
    })
  }, [scene, lite])

  return <primitive object={scene} />
}
