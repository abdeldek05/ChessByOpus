import { Text } from '@react-three/drei'
import { LaunchButton3D } from './LaunchButton3D'
import {
  CONSOLE_POSITION,
  CONSOLE_ROTATION_Y,
  CABINET,
  SCREEN,
  KEYBOARD,
  CONSOLE_COLORS,
} from '@/three/constants/controlConsole'

interface ControlConsoleProps {
  /** Scénario armé : le bouton LANCER est actif. */
  launchEnabled: boolean
  onLaunch: () => void
}

const CABINET_TOP_Y = CABINET.legHeight + CABINET.height
const SCREEN_CENTER_Y = CABINET_TOP_Y + SCREEN.height / 2 + 0.06

/**
 * Poste de commande au sol : caisson sur pieds, clavier, et écran incliné qui
 * affiche l'en-tête « CHESS · CONTRÔLE TIR » et le bouton LANCER 3D cliquable.
 * Purement du rendu : l'interaction vit dans LaunchButton3D / useLaunchButton.
 */
export function ControlConsole({ launchEnabled, onLaunch }: ControlConsoleProps) {
  return (
    <group position={CONSOLE_POSITION} rotation={[0, CONSOLE_ROTATION_Y, 0]}>
      {/* Pieds */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}-${sz}`}
            position={[
              sx * (CABINET.width / 2 - 0.12),
              CABINET.legHeight / 2,
              sz * (CABINET.depth / 2 - 0.12),
            ]}
            castShadow
          >
            <boxGeometry args={[0.1, CABINET.legHeight, 0.1]} />
            <meshStandardMaterial color={CONSOLE_COLORS.leg} roughness={0.6} metalness={0.3} />
          </mesh>
        )),
      )}

      {/* Caisson */}
      <mesh position={[0, CABINET.legHeight + CABINET.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[CABINET.width, CABINET.height, CABINET.depth]} />
        <meshStandardMaterial color={CONSOLE_COLORS.cabinet} roughness={0.55} metalness={0.35} />
      </mesh>

      {/* Clavier posé devant, sur le dessus du caisson */}
      <mesh
        position={[0, CABINET_TOP_Y + KEYBOARD.height / 2, CABINET.depth / 2 - KEYBOARD.depth / 2 - 0.05]}
        rotation={[-0.05, 0, 0]}
        castShadow
      >
        <boxGeometry args={[KEYBOARD.width, KEYBOARD.height, KEYBOARD.depth]} />
        <meshStandardMaterial color={CONSOLE_COLORS.keyboard} roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Écran incliné : bezel + dalle allumée + en-tête + bouton */}
      <group
        position={[0, SCREEN_CENTER_Y, -CABINET.depth / 2 + 0.14]}
        rotation={[SCREEN.tiltRad, 0, 0]}
      >
        {/* Bezel */}
        <mesh castShadow>
          <boxGeometry
            args={[SCREEN.width + SCREEN.bezel, SCREEN.height + SCREEN.bezel, SCREEN.depth]}
          />
          <meshStandardMaterial color={CONSOLE_COLORS.screenBezel} roughness={0.4} metalness={0.4} />
        </mesh>

        {/* Dalle allumée */}
        <mesh position={[0, 0, SCREEN.depth / 2 + 0.001]}>
          <planeGeometry args={[SCREEN.width, SCREEN.height]} />
          <meshStandardMaterial
            color={CONSOLE_COLORS.screenGlow}
            emissive={CONSOLE_COLORS.screenGlow}
            emissiveIntensity={1.4}
            roughness={0.3}
          />
        </mesh>

        {/* En-tête */}
        <Text
          position={[0, SCREEN.height * 0.32, SCREEN.depth / 2 + 0.02]}
          fontSize={SCREEN.height * 0.08}
          color={CONSOLE_COLORS.screenText}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
        >
          CHESS · FIRE CONTROL
        </Text>

        <LaunchButton3D enabled={launchEnabled} onLaunch={onLaunch} />
      </group>
    </group>
  )
}
