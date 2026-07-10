import { Text } from '@react-three/drei'
import { useLaunchButton } from '@/three/hooks/useLaunchButton'
import { SCREEN, LAUNCH_BUTTON, CONSOLE_COLORS } from '@/three/constants/controlConsole'

interface LaunchButton3DProps {
  enabled: boolean
  onLaunch: () => void
}

const BUTTON_WIDTH = SCREEN.width * 0.62
const BUTTON_HEIGHT = SCREEN.height * 0.3

/**
 * Bouton LANCER affiché sur l'écran du poste de commande. Vert lumineux et
 * cliquable quand le scénario est armé (enabled) ; gris verrouillé sinon. Le
 * clic (relâché du pointeur) déclenche `onLaunch`.
 */
export function LaunchButton3D({ enabled, onLaunch }: LaunchButton3DProps) {
  const { hovered, pressed, handlers } = useLaunchButton({ enabled, onLaunch })

  const color = enabled ? LAUNCH_BUTTON.armedColor : LAUNCH_BUTTON.lockedColor
  const emissive = enabled
    ? hovered
      ? LAUNCH_BUTTON.hoverEmissive
      : LAUNCH_BUTTON.armedEmissive
    : LAUNCH_BUTTON.lockedEmissive
  const z = SCREEN.depth / 2 + (pressed ? 0.005 : 0.02)

  return (
    <group position={[0, -SCREEN.height * 0.16, 0]}>
      {/* Pastille du bouton, légèrement en relief sur l'écran. */}
      <mesh position={[0, 0, z]} {...handlers}>
        <boxGeometry args={[BUTTON_WIDTH, BUTTON_HEIGHT, 0.03]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={enabled ? (hovered ? 1.4 : 0.9) : 0}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      <Text
        position={[0, 0, z + 0.02]}
        fontSize={BUTTON_HEIGHT * 0.42}
        color={enabled ? '#04170c' : CONSOLE_COLORS.screenText}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
      >
        {enabled ? 'LAUNCH' : 'LOCKED'}
      </Text>
    </group>
  )
}
