import { useElevationAim } from '@/three/hooks/useElevationAim'

interface AimPlaneProps {
  onChange: (deg: number) => void
}

/**
 * Plan de saisie invisible couvrant la scène d'élévation : capte le glisser et
 * le convertit en angle autour du pivot (via useElevationAim). Invisible mais
 * raycastable (opacité 0, pas de depthWrite).
 */
export function AimPlane({ onChange }: AimPlaneProps) {
  const { handlers } = useElevationAim(onChange)

  return (
    <mesh {...handlers} position={[0.6, 2.2, 0]}>
      <planeGeometry args={[14, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
