import type { CameraMode } from '@/types/scene.types'

interface CameraModeSelectorProps {
  mode: CameraMode
  onSelect: (mode: CameraMode) => void
}

/** Les 3 modes proposés, dans l'ordre d'affichage, avec leur libellé court. */
const MODES: { value: CameraMode; label: string; title: string }[] = [
  { value: 'follow', label: 'KING', title: 'Follow the King rocket' },
  { value: 'radar', label: 'RADAR', title: 'View from the radar site' },
  { value: 'wide', label: 'WIDE', title: 'Fixed wide shot — whole theater' },
]

/**
 * Sélecteur HUD des modes de caméra pendant le vol (suivi King / vue côté radar
 * / vue large fixe — voir CameraMode, LaunchCameraControls). Colonne VERTICALE
 * type « tableau de bord », alignée en haut à GAUCHE, JUSTE SOUS le bouton
 * jour/nuit (☾, à top-6 left-6, h-11) : même colonne d'outils, empilés
 * proprement plutôt que dispersés à l'écran. Mode actif surligné. Style
 * angulaire lumineux cohérent avec DayNightToggle.
 */
export function CameraModeSelector({ mode, onSelect }: CameraModeSelectorProps) {
  return (
    <div className="hud-command clip-corner-10 pointer-events-auto absolute top-20 left-6 z-20 flex w-11 flex-col gap-px">
      {MODES.map((m) => {
        const active = m.value === mode
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onSelect(m.value)}
            title={m.title}
            aria-pressed={active}
            className={`px-1 py-2 font-mono text-micro tracking-widest transition-colors ${
              active ? 'bg-accent-bright/25 text-accent-bright' : 'text-accent-bright/55 hover:bg-accent-bright/10'
            }`}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
