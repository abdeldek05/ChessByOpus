import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createParticleTexture } from '@/lib/createParticleTexture'

interface ScorchDecalProps {
  /** Vol lancé : la brûlure apparaît et s'assombrit, puis reste marquée au sol. */
  launched: boolean
  /** Rayon de la tache de brûlure (unités scène). */
  radius?: number
  /** Hauteur du plateau où poser la décalcomanie (juste au-dessus). */
  y?: number
}

/**
 * Tache de BRÛLURE au sol autour de la rampe : un disque sombre à dégradé radial
 * (texture procédurale douce, même que les particules) posé à plat sur le
 * plateau. Invisible avant le tir ; au décollage il apparaît en s'assombrissant,
 * puis reste marqué — comme les traces de suie sous une rampe réelle. Rendu pur.
 */
export function ScorchDecal({ launched, radius = 9, y = 0.06 }: ScorchDecalProps) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const opacity = useRef(0)
  const texture = useMemo(() => createParticleTexture(0.55), [])
  useEffect(() => () => texture.dispose(), [texture])

  useFrame((_, delta) => {
    if (!matRef.current) return
    // Monte vers ~0.8 quand lancé, redescend à 0 sinon (réarmement).
    const target = launched ? 0.82 : 0
    opacity.current += (target - opacity.current) * Math.min(1, delta * 2.5)
    matRef.current.opacity = opacity.current
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        color="#120d08"
        transparent
        opacity={0}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  )
}
