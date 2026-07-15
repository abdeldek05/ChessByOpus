import type { SceneMode } from '@/types/scene.types'

interface DayNightToggleProps {
  mode: SceneMode
  onToggle: () => void
}

const CLIP = 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'

/**
 * Bouton HUD de bascule JOUR/NUIT de la scène : affiche l'icône de l'ambiance
 * vers laquelle on bascule (☾ en journée → passe en nuit, ☀ la nuit → retour
 * au jour). Style angulaire lumineux, cohérent avec le reste du HUD.
 */
export function DayNightToggle({ mode, onToggle }: DayNightToggleProps) {
  const goingNight = mode === 'day'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={goingNight ? 'Switch to night' : 'Switch to day'}
      title={goingNight ? 'Night mode' : 'Day mode'}
      className="pointer-events-auto absolute top-6 left-6 z-10 flex h-11 w-11 items-center justify-center border border-accent-bright/40 bg-black/40 font-mono text-xl text-accent-bright shadow-[0_0_24px_rgba(0,0,0,0.35)] transition-colors hover:bg-accent-bright/20"
      style={{ clipPath: CLIP }}
    >
      {goingNight ? '☾' : '☀'}
    </button>
  )
}
