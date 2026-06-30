interface RecenterButtonProps {
  onClick: () => void
}

export function RecenterButton({ onClick }: RecenterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Revenir à la vue d'ensemble"
      className="pointer-events-auto border border-border bg-bg/80 px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] text-ink-dim uppercase backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
    >
      ⟲ Vue d'ensemble
    </button>
  )
}
