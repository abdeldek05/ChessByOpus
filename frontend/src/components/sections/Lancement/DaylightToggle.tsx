interface DaylightToggleProps {
  isDay: boolean
  onToggle: () => void
}

/** Petit bouton soleil/lune : bascule l'ambiance jour ↔ nuit de la scène. */
export function DaylightToggle({ isDay, onToggle }: DaylightToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDay ? 'Passer en nuit' : 'Passer en jour'}
      className="pointer-events-auto flex size-10 items-center justify-center border border-accent/50 bg-bg/70 text-accent backdrop-blur-sm transition-colors duration-200 ease-out hover:border-accent hover:bg-bg/90"
    >
      {isDay ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
