interface AdminRefreshButtonProps {
  isLoading: boolean
  onClick: () => void
}

/** Rechargement explicite du tableau de bord. */
export function AdminRefreshButton({ isLoading, onClick }: AdminRefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="type-label-tight rounded-full bg-surface-2 px-5 py-2.5 text-ink-dim transition-colors duration-300 ease-out hover:bg-accent hover:text-bg disabled:cursor-wait disabled:opacity-60"
    >
      {isLoading ? 'Chargement…' : 'Rafraîchir'}
    </button>
  )
}
