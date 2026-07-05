import { Environment, Lightformer } from '@react-three/drei'
import { IBL_PANELS, IBL_RESOLUTION } from '@/three/constants/launchDaylight'

/**
 * Environnement d'extérieur baké une seule fois (frames={1}, donc gratuit en
 * continu) : sans lui, les matériaux métalliques de la fusée et du garde-corps
 * n'ont rien à réfléchir et rendent noirs. Même approche que StudioLighting
 * pour la vitrine, avec des panneaux « plein air » (ciel, soleil, herbe).
 */
export function OutdoorEnvironment() {
  return (
    <Environment frames={1} resolution={IBL_RESOLUTION} background={false}>
      {IBL_PANELS.map((panel, index) => (
        <Lightformer
          key={index}
          form={panel.form}
          intensity={panel.intensity}
          position={panel.position}
          scale={panel.scale}
          color={panel.color}
        />
      ))}
    </Environment>
  )
}
