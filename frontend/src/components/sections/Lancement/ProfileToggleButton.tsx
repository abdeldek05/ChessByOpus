interface ProfileToggleButtonProps {
  open: boolean
  onToggle: () => void
}

/**
 * Bouton HUD d'ouverture du PANNEAU DE PROFIL de couverture (coupe Thales),
 * placé dans la colonne d'outils de gauche, SOUS le sélecteur de caméra
 * (KING/RADAR/WIDE) — même vocabulaire visuel (clip angulaire, glow, teinte
 * accent). Icône « profil » (courbe). Actif = panneau ouvert (surligné).
 */
export function ProfileToggleButton({ open, onToggle }: ProfileToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Coverage profile"
      aria-pressed={open}
      title="Coverage profile (Thales cut)"
      className={`hud-command clip-corner-10 pointer-events-auto absolute top-52 left-6 z-20 flex h-11 w-11 items-center justify-center font-mono text-lg transition-colors ${
        open
          ? 'border-accent-bright bg-accent-bright/25 text-accent-bright'
          : 'text-accent-bright/70 hover:bg-accent-bright/15'
      }`}
    >
      ⛰
    </button>
  )
}
