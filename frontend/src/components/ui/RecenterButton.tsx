interface RecenterButtonProps {
  onClick: () => void
}

export function RecenterButton({ onClick }: RecenterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Return to overview"
      className="group pointer-events-auto flex items-center gap-2 rounded-full bg-surface/90 py-2.5 pr-5 pl-4 font-display text-xs font-semibold tracking-wide text-accent shadow-lg shadow-black/15 backdrop-blur-md transition-colors duration-200 hover:bg-accent hover:text-bg"
    >
      <svg viewBox="0 0 24 24" className="size-4 transition-transform duration-500 group-hover:-rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </svg>
      Overview
    </button>
  )
}
